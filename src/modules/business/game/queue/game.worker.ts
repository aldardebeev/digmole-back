import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { EQueue } from "src/libs/queues/queue.enum";

@Processor(EQueue.START_GAME)
export class GameWorker extends WorkerHost {
    private readonly logger: Logger = new Logger(GameWorker.name)

    process(job: Job<{chatId: string, amount: string}, string, string>, token?: string): any {
        job.log('We ok!')
        return `You win: ${job.data.amount}`
    }
}