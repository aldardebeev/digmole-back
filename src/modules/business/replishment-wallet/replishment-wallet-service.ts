import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"
import axios from 'axios';
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { ECcy } from 'src/libs/ccy/ccy.enum';

@Injectable()
export class ReplishmentWalletService {
    constructor(
        private readonly prismaService: PrismaService,
        @InjectQueue(EQueue.CHECK_INPUT_TRANSACTION) private readonly checkInputTransactionQueue: Queue,
    ) { }

    async initReplishmentCheckJob(): Promise<void> {
        const jobId = randomUUID();
        const jobOptions: JobsOptions = { repeat: { every: 10000 }, jobId: 'CHECK_BLOCKS' };
        (await this.checkInputTransactionQueue.add("jobId", {}, jobOptions)).log('Job added');
    }

    async checkReplishmentTransaction(): Promise<void> {
        const address = 'rod1d5we29rhpwmy5anrua3sdr78e7zhr38qav7yty7fjn3709j4kzvqt975em';
        const url = `https://mainnet.umi.top/api/addresses/${address}/transactions?limit=10&offset=-10`;

        try {
            const response = await axios.get(url);
            if (response.data && response.data.data && response.data.data.items) {
                for (const item of response.data.data.items) {
                    console.log("WalletExists   ", !await this.WalletExists(item.senderAddress))
                    if (!await this.WalletExists(item.senderAddress)) {
                        continue;
                    }
                    console.log("txExists   ",await this.txExists(item))
                    if (await this.txExists(item)) {   
                        continue;
                    }

                    await this.saveTransaction(item.senderAddress, item.amount, item.hash)
    
                }
            }
           
        } catch (error) {
            // console.log(error.message)
        }
    }

    async saveTransaction(address: string, amount: number, tx: string) {
        const wallet = await this.prismaService.wallet.findFirst({
            where: {
                address: address
            },
            select: {
                id: true,
            }
        });

        console.log("wallet id - ", wallet.id, address, tx, amount)

        return this.prismaService.$transaction(async () => {
            const walletInputTranscation = await this.prismaService.walletInputTranscation.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    ccy: ECcy.ROD,
                    tx: tx,
                },
            })
            console.log(walletInputTranscation)

            if (!walletInputTranscation) {
                throw new Error(`${tx} - no record was created`)
            }

            const walletBalance = await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: wallet.id,
                        ccy: ECcy.ROD
                    }
                },
                data: {
                    amountApp: {
                        increment: amount,
                    },
                }
             
            })
            console.log("walletBalance - ", walletBalance)
            return walletBalance.amountApp
        })
    }

    private async WalletExists(address: string): Promise<boolean> {
        const wallet = await this.prismaService.wallet.findUnique({
            where: {
                address: address
            },
            select: {
                id: true,
            },
        });
        return !!wallet
    }

    private async txExists(transaction: any): Promise<boolean> {
        const walletInputTranscation = await this.prismaService.walletInputTranscation.findUnique({
            where: {
                tx: transaction.hash,
                amount: transaction.amount,
            },
            select: {
                id: true,
            },
        });
      
        return !!walletInputTranscation
    }


    // private currentBlockchainHeight = null;
    // private BLOCKCHAIN_INDENT_AMOUNT = 10;
    // private maxAmountProcesses = 10


    // async startCheckBlockNumbers(fromBlockNumber, toBlockNumber: number) {
    //     let currentAmountProcesses = 0;

    //     while (fromBlockNumber < toBlockNumber && currentAmountProcesses < this.maxAmountProcesses) {

    //         this.startReplishmentCheckJob(fromBlockNumber);

    //         fromBlockNumber++;
    //         currentAmountProcesses++;
    //     }
    //     this.updateLastCheckedBlock(fromBlockNumber);
    // }

    // async getBlockchainHeight() {
    //     if (this.currentBlockchainHeight === null) {
    //         try {
    //             const latestBlockNumber = await this.getLatestBlockNumber();
    //             this.currentBlockchainHeight = latestBlockNumber - this.BLOCKCHAIN_INDENT_AMOUNT;
    //         } catch (error) {
    //             console.error('Error fetching latest block number:', error);
    //             throw error;
    //         }
    //     }

    //     return this.currentBlockchainHeight;
    // }


    // async getLatestBlockNumber() {
    //     try {
    //         const response = await axios.get('https://mainnet.umi.top/api/blocks?limit=1&offset=-1');
    //         const data = response.data;

    //         if (data && data.items && data.items.length > 0) {
    //             return data.items[0].height;
    //         } else {
    //             throw new Error('No block data found');
    //         }
    //     } catch (error) {
    //         throw new Error(error.message);
    //     }
    // }

    async updateLastCheckedBlock(blockNumber: number) {
        await this.prismaService.blockchainScan.update({
            where: {
                ccy: 'rod',
            },
            data: {
                lastCheckedBlock: blockNumber,
            },
        });
    }

}

