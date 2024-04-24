import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, PublicKey, SecretKey, Transaction, textEncode, base64Decode, hexEncode, base64Encode } from '@umi-top/umi-core-js'
import gameQueue from "../queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"
import { CcyEnum } from '@prisma/client';
import { mnemonicToSeedSync } from 'bip39';
import { getTx } from '../withdrawal/test';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    constructor(private readonly prismaService: PrismaService) { }
    
    async startGame(chatId: string, amount: number){
        const user = await  this.getUser(chatId)
        this.checkAvailableAmount(user.Wallet.WalletBalance.amountApp, amount, chatId)


    }

    async createTransaction(chatId: string, amount: number) {
        try {
            const currentAmount = amount * 100;
            const mnemonic = `champion hybrid fat claim chicken nerve about visa limb oak great simple mirror often tomorrow program panther stamp garlic prosper couple buddy local deputy`;
            const seed = mnemonicToSeedSync(mnemonic)

            const secKey = SecretKey.fromSeed(seed)
            const sender = Address.fromKey(secKey).setPrefix('rod')
            const recipientAddress = await this.getSenderAddress(chatId);

           const tx = getTx(mnemonic, sender.getBech32(), recipientAddress, currentAmount, 8 )
            return tx;
        } catch (e: unknown) {
            console.log(e);
        }
    }
    getSenderAddress(chatId: string) {
        throw new Error('Method not implemented.');
    }

    async checkAvailableAmount(amountApp: number, amount: number, chatId: string){
        if(amountApp < amount){
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: amountApp / 100
            }));
        }
    }

    async getUser(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            },
            include : {
                Wallet : {
                    include: {
                        WalletBalance: true
                    }
                }
            }
        })
        return user
    }
   
}

