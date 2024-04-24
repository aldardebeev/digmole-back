import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, SecretKey, Transaction, base64Encode, hexEncode } from '@umi-top/umi-core-js';
import { mnemonicToSeedSync } from 'bip39';
import { getTx } from './test';
import gameQueue from "../queue/send.job.connection";
import { EQueue } from 'src/libs/queues/queue.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class WithdrawalService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async withdrawal(chatId: string, amount: number) {
        const currentAmount = amount * 100;
        
        if(await this.checkAvailableAmountWithdrawal(chatId) < currentAmount){
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: await this.checkAvailableAmountWithdrawal(chatId) / 100
            }));
        }
    
        const tx = await this.createTransaction(chatId, currentAmount);

        fetch('https://mainnet.umi.top/api/mempool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: tx
            })
        }).then(function (response) {
            console.log(response.status, response.statusText)
            return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "withdrawal",
            });
        }).then(function (json) {
            console.log('parsed json', json)
        }).catch(function (ex) {
            console.log('parsing failed', ex)
        })
    }

    async createTransaction(chatId: string, amount: number) {
        try {
            const mnemonic = `champion hybrid fat claim chicken nerve about visa limb oak great simple mirror often tomorrow program panther stamp garlic prosper couple buddy local deputy`;
            const seed = mnemonicToSeedSync(mnemonic)

            const secKey = SecretKey.fromSeed(seed)
            const sender = Address.fromKey(secKey).setPrefix('rod')
            const recipientAddress = await this.getSenderAddress(chatId);

            const tx = getTx(mnemonic, sender.getBech32(), recipientAddress, amount, 8)
            return tx;
        } catch (e: unknown) {
            console.log(e);
        }
    }

    async getSenderAddress(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: true
            }
        })
        return user.Wallet.address
    }

    async checkAvailableAmountWithdrawal(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: {
                    include: {
                        WalletBalance: true,
                    }
                }
            }
        })
       return user.Wallet.WalletBalance.amountApp;
    }

}

