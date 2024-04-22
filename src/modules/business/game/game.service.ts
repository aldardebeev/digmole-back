import { GameModule } from './game.module'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, PublicKey, SecretKey, Transaction, textEncode, base64Decode, hexEncode, base64Encode } from '@umi-top/umi-core-js'
import gameQueue from "../queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    constructor(private readonly prismaService: PrismaService) { }
    
    async createUser(chatId: string, username: string, address: string): Promise<any> {
        try {

            if (await this.userExists(chatId)) {
                console.log("user exists")
                return;
            }

            if (!this.isValidAdress(address)) {
                console.log("addres invalid")
                return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), { chatId: chatId.toString(), messageType: "invalidAddress" });
            }
            const randomMessage = this.generateRandomMessage()
            const user = await this.prismaService.user.create({
                data: {
                    chatId: chatId.toString(),
                    username: username,
                    Wallet: {
                        create: {
                            address: address,
                            signaturePhrase: randomMessage
                        }
                    }
                },
                include: {
                    Wallet: true,
                },
            });
            console.log("create")
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "createUser",
                phrase: randomMessage
            }));
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    private async userExists(chatId: string): Promise<boolean> {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            },
        });
        return !!user;
    }

    private isValidAdress(address: string) {
        try {
            Address.fromBech32(address)
            console.log( Address.fromBech32(address))
            return true
        } catch (error) {
            return false
        }
    }

    private generateRandomMessage(): string {
        const prefix = "blackjack_rod_";
        const randomString = Math.random().toString(36).substring(2, 15);
        return prefix + randomString;
    }

    async checkSignature(chatId: string, signature: string): Promise<any> {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            },
            include: {
                Wallet: true,
            }
        });
       
        const pubKey = Address.fromBech32(user.Wallet.address).getPublicKey()
        
        try{
            const isValid = pubKey.verifySignature(base64Decode(signature), textEncode(user.Wallet.signaturePhrase))
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "checkSignature",
                address: user.Wallet.address,
                isValid: isValid
            }));
        }catch(error){
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "checkSignature",
                address: user.Wallet.address,
                isValid: false
            }));
        }

     
       
    }
    
}

