import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';

@Injectable()
export class ReplishmentWalletService {
    constructor(
        private readonly prismaService: PrismaService,
        @InjectQueue(EQueue.CHECK_INPUT_TRANSACTION) private readonly checkInputTransactionQueue: Queue,
    ) { }

    async initReplishmentCheckJob(): Promise<void> {
        const jobId = randomUUID();
        const jobOptions: JobsOptions = { repeat: { every: 10000 }, jobId: jobId };
        await this.checkInputTransactionQueue.add(jobId, {}, jobOptions);
    }

    async checkReplishmentTransaction(): Promise<void> {
        
        console.log("checkReplishmentTransaction")
        
    }
}

