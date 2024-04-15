import { GameModule } from './game.module'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WalletSourceType } from '@prisma/client';
import { Address, PublicKey, SecretKey, Transaction, textEncode, base64Decode } from '@umi-top/umi-core-js'
import gameQueue from "../game/queue/send.job.connection";
import { randomUUID } from "crypto"
import  { EQueue } from "../../../libs/queues/queue.enum"
@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    constructor(private readonly prismaService: PrismaService) { }
    async createUser(chatId: string, username: string, address: string): Promise<any> {
        try {

            // if(await this.userExists(chatId)){
            //    return ;
            // }
           
            if (!this.isValidAdress(address)) {
                return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), { chatId: chatId.toString(), message: "invalidAddress" });
            }

            const user = await this.prismaService.user.create({
                data: {
                    chatId: chatId.toString(),
                    username: username,
                    Wallets: {
                        create: [{ type: WalletSourceType.INTERNAL, address: address }],
                    },
                },
                include: {
                    Wallets: true,
                },
            });
            return user;
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
            return true
        } catch (error) {
            return false
        } 
    }

    async replishmentWallet(chatId: string, amount: string): Promise<any> {
        try {
            const user = await this.prismaService.user.findFirst({
                where: {
                    chatId: chatId,
                },
                include: {
                    Wallets: true,
                }
            });
            const address = Address.fromBech32(user.Wallets[0].address)

            const secKey = SecretKey.fromSeed(new Uint8Array(12))
            const message = textEncode('Hello World')
            const signature = secKey.sign(message)

            // console.log(pubKey.verifySignature(signature, message))
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }
}

