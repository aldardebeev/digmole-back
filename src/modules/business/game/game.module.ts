import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { EQueue } from 'src/libs/queues/queue.enum';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { PrismaModule } from 'src/modules/infrastructure/prisma/prisma.module';
import { StartGameWorker, ReplishmentWalletWorker } from './queue/game.worker';

@Module({
  imports: [
    PrismaModule,
    ...Object.values(EQueue).flatMap((queue) => [
        BullModule.registerQueue({ name: queue }),
        BullBoardModule.forFeature({ name: queue, adapter: BullMQAdapter })
    ]),
  ],
  providers: [GameService, StartGameWorker, ReplishmentWalletWorker],
})
export class GameModule { }
