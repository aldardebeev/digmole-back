import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { EQueue } from "src/libs/queues/queue.enum";
import { GameService } from '../game.service';

@Processor(EQueue.START_BOT)
export class StartGameWorker extends WorkerHost {
    constructor(private readonly gameService: GameService) { super()}

    async process(job: Job<{chatId: string, username: string}, string, string>, token?: string): Promise<any> {
        const { chatId, username } = job.data;
        return await this.gameService.createUser(chatId, username);
    }
}

@Processor(EQueue.REPLISHMENT_WALLET)
export class ReplishmentWalletWorker extends WorkerHost { 
    constructor(private readonly gameService: GameService) { super()}
    async process(job: Job<{chatId: string, amount: string}, string, string>, token?: string): Promise<any> {
        const { chatId, amount } = job.data;
        return await this.gameService.replishmentWallet(chatId, amount);
    }
}