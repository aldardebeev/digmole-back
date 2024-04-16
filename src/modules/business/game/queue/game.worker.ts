import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { EQueue } from "src/libs/queues/queue.enum";
import { GameService } from '../game.service';

@Processor(EQueue.START_BOT)
export class StartGameWorker extends WorkerHost {
    constructor(private readonly gameService: GameService) { super()}

    async process(job: Job<{chatId: string, username: string, address: string}, string, string>, token?: string): Promise<any> {
        const { chatId, username, address } = job.data;
        return await this.gameService.createUser(chatId, username, address);
    }
}

@Processor(EQueue.CHECK_SIGNATURE)
export class ReplishmentWalletWorker extends WorkerHost { 
    constructor(private readonly gameService: GameService) { super()}
    async process(job: Job<{chatId: string, signature: string}, string, string>, token?: string): Promise<any> {
        const { chatId, signature } = job.data;
        return await this.gameService.checkSignature(chatId, signature);
    }
}