import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EQueue } from "src/libs/queues/queue.enum";
import { GameService } from '../game/game.service';
import { ReplishmentWalletService } from "../replishment-wallet/replishment-wallet-service";
import { WithdrawalService } from "../withdrawal/withdrawal";
import { WalletService } from "../wallet/wallet";

@Processor(EQueue.START_BOT)
export class StartGameWorker extends WorkerHost {
    constructor(private readonly gameService: GameService) { super()}

    async process(job: Job<{chatId: string, username: string, address: string}, string, string>, token?: string): Promise<any> {
        const { chatId, username, address } = job.data;
        return await this.gameService.createUser(chatId, username, address);
    }
}

@Processor(EQueue.CHECK_SIGNATURE)
export class CheckSignatureWorker extends WorkerHost { 
    constructor(private readonly gameService: GameService) { super()}
    async process(job: Job<{chatId: string, signature: string}, string, string>, token?: string): Promise<any> {
        const { chatId, signature } = job.data;
        return await this.gameService.checkSignature(chatId, signature);
    }
}

@Processor(EQueue.CHECK_INPUT_TRANSACTION)
export class ReplishmentWalletWorker extends WorkerHost { 
    constructor(private readonly replishmentWalletService: ReplishmentWalletService) { super()}
    async process(job: Job<{}, string, string>, token?: string): Promise<any> {
        return await this.replishmentWalletService.checkReplishmentTransaction();
    }
}

@Processor(EQueue.WITHDRAWAL)
export class WithdrawalWorker extends WorkerHost { 
    constructor(private readonly withdrawalService: WithdrawalService) { super()}
    async process(job: Job<{chatId: string, amount: number}, string, string>, token?: string): Promise<any> {
        const { chatId, amount } = job.data;
        return await this.withdrawalService.withdrawal(chatId, amount);
    }
}

@Processor(EQueue.EXISTS_WALLET)
export class CheckWalletWorker extends WorkerHost { 
    constructor(private readonly walletService: WalletService) { super()}
    async process(job: Job<{chatId: string}, string, string>, token?: string): Promise<any> {
        return await this.walletService.checkExistWallet(job.data.chatId);
    }
}

@Processor(EQueue.BALANCE)
export class BalanceWorker extends WorkerHost { 
    constructor(private readonly walletService: WalletService) { super()}
    async process(job: Job<{chatId: string}, string, string>, token?: string): Promise<any> {
        return await this.walletService.balance(job.data.chatId);
    }
}