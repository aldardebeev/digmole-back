import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, SecretKey, Transaction, base64Encode, hexEncode } from '@umi-top/umi-core-js';
import { mnemonicToSeedSync } from 'bip39';
import { getTx, getTxNotMnemonic } from './test';
import gameQueue from "../queue/send.job.connection";
import { EQueue } from 'src/libs/queues/queue.enum';
import { randomUUID } from 'crypto';
import { CcyEnum } from '@prisma/client';

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
        }).then(async (response) =>{
            console.log(response.status, response.statusText);

            return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "withdrawal",
                amount: amount,
                balance: await this.saveTransaction(chatId, tx, currentAmount)
            });

        }).then(function (json) {
            console.log('parsed json', json)
        }).catch(function (ex) {
            console.log('parsing failed', ex)
        })
    }

    async saveTransaction(chatId: string, tx: string, amount: number) {
        const wallet = await this.getRecipientWallet(chatId);

        return await this.prismaService.$transaction(async () => {
            const walletWithdrawalTranscation = await this.prismaService.walletWithdrawalTranscation.create({
                data: {
                    walletId: wallet.id,
                    addressTo: wallet.address,
                    ccy: CcyEnum.rod,
                    amount: amount,
                    tx: tx,
                }
            })
            if (!walletWithdrawalTranscation) {
                throw new Error(`${tx} - no record was created`)
            }

            const walletBalance = await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: wallet.id,
                        ccy: CcyEnum.rod
                    }
                },
                data: {
                    amountApp: {
                        decrement: amount,
                    },
                }
             
            })

            return walletBalance.amountApp / 100
        })
    }

    async createTransaction(chatId: string, amount: number) {
        try {
            const mnemonic = `champion hybrid fat claim chicken nerve about visa limb oak great simple mirror often tomorrow program panther stamp garlic prosper couple buddy local deputy`;
            const seed = mnemonicToSeedSync(mnemonic)

            const secKey = SecretKey.fromSeed(seed)
            const sender = Address.fromKey(secKey).setPrefix('rod')
            const recipientAddress = await this.getRecipientWallet(chatId);

            const tx = getTxNotMnemonic(secKey, sender.getBech32(), recipientAddress.address, amount, 8)
            return tx;
        } catch (e: unknown) {
            console.log(e);
        }
    }

    async getRecipientWallet(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: true
            }
        })
        return user.Wallet
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

