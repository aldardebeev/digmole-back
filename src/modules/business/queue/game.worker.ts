import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EQueue } from "src/libs/queues/queue.enum";
import { UserService } from "../user/user.service";
import { GameService } from "../game/game.service";
import { ReplishmentWalletService } from "../replishment-wallet/replishment-wallet-service";

@Processor(EQueue.START_BOT)
export class StartBotWorker extends WorkerHost {
    constructor(private readonly userService: UserService) { super()}
    async process(job: Job<{chatId: string, username: string}, string, string>, token?: string): Promise<any> {
        const { chatId, username } = job.data;
        return await this.userService.createUser(chatId, username);
    }
}

@Processor(EQueue.BALANCE)
export class BalanceWorker extends WorkerHost { 
    constructor(private readonly userService: UserService) { super()}
    async process(job: Job<{chatId: string}, string, string>, token?: string): Promise<any> {
        return await this.userService.balance(job.data.chatId);
    }
}

@Processor(EQueue.START_GAME)
export class StartGameWorker extends WorkerHost { 
    constructor(private readonly gameService: GameService) { super()}
    async process(job: Job<{chatId: string}, string, string>, token?: string): Promise<any> {
        return await this.gameService.startGame(job.data.chatId);
    }
}

@Processor(EQueue.CHECK_INPUT_TRANSACTION)
export class ReplishmentWalletWorker extends WorkerHost { 
    constructor(private readonly replishmentWalletService: ReplishmentWalletService) { super()}
    async process(job: Job<{}, string, string>, token?: string): Promise<any> {
        return await this.replishmentWalletService.checkReplishmentTransaction();
    }
}

