import { GameModule } from '../game.module'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Address, PublicKey, SecretKey, Transaction, textEncode, base64Decode, hexEncode, base64Encode } from '@umi-top/umi-core-js'
import gameQueue from "../../game/queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../../libs/queues/queue.enum"
import { create } from 'domain';
import axios from 'axios';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReplishmentWalletService {
    constructor(
        private readonly prismaService: PrismaService,
        @InjectQueue(EQueue.CHECK_INPUT_TRANSACTION) private readonly checkInputTransactionQueue: Queue,
        // private currentBlockchainHeight = null,
        // private BLOCKCHAIN_INDENT_AMOUNT = 10
    ) { }

    async initReplishmentCheckJob(): Promise<void> {
        await this.checkReplishmentTransaction();

        await this.startReplishmentCheckJob();
    }

    private async startReplishmentCheckJob(): Promise<void> {
        const jobId = randomUUID();
        const jobOptions = { repeat: { every: 10000 } };
        (await this.checkInputTransactionQueue.add("jobId", {}, jobOptions)).log('Job added');
    }

    async checkReplishmentTransaction(): Promise<void> {
        const address = 'rod1js4u86dwmajqmwhjyk4zsju0s05sd7ypklzf2vqepvrus3gxnnksdp5j8s';
        const url = `https://mainnet.umi.top/api/addresses/${address}/transactions?limit=10&offset=-1`;

        try {
            const response = await axios.get(url);
            response.data.data.items.forEach(item => {
                // console.log(item);
                // Дальнейшая обработка каждого элемента
            });
        } catch (error) {
        }
    }
  
    //  async  getBlockchainHeight() {
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
    
    
    // async  getLatestBlockNumber() {
    // try {
    //     const response = await axios.get('https://mainnet.umi.top/api/blocks?limit=1&offset=-1');
    //     const data = response.data;

    //     if (data && data.items && data.items.length > 0) {
    //         return data.items[0].height;
    //     } else {
    //         throw new Error('No block data found');
    //     }
    // } catch (error) {
    //     throw new Error(error.message);
    // }
// }

}

