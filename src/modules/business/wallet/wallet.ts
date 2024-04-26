import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import gameQueue from "../queue/send.job.connection";
import { EQueue } from 'src/libs/queues/queue.enum';
import { randomUUID } from 'crypto';
import { CcyEnum } from '@prisma/client';
@Injectable()
export class WalletService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async checkExistWallet(chatId: string) {
        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "checkLinkWallet",
            isLink: await this.existWallet(chatId),
        });
    }

    async checkAvailableAmount(chatId: string) {
        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "checkAvailableAmount",
            isLink: await this.existWallet(chatId),
            availableAmount: await this.getBalance(chatId) >= 0.01 ? true : false,
        });
    }

    async existWallet(chatId: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: true
            }
        });
        
        if (user) {
             return user.Wallet ? true : false;
        }else{
            return false;
        }
    }

    async balance(chatId: string) {
        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "balance",
            amount: await this.getBalance(chatId),
        });
    }

    async getBalance(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: {
                    include: {
                        WalletBalance: {
                            where: {
                                ccy: CcyEnum.rod
                            }
                        }
                    }
                }

            }
        });
        return user.Wallet.WalletBalance.amountApp / 100
    }
}

