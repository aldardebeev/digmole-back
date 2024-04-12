import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { EQueue } from 'src/libs/queues/queue.enum';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { PrismaModule } from 'src/modules/infrastructure/prisma/prisma.module';
import { GameWorker } from './queue/game.worker';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
       name: EQueue.START_BOT,
    }),
    BullBoardModule.forFeature({
      name: EQueue.START_BOT,
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: EQueue.START_GAME_SESSION,
   }),
   BullBoardModule.forFeature({
     name: EQueue.START_GAME_SESSION,
     adapter: BullMQAdapter,
   }),
  ],
  providers: [GameService, GameWorker],
})
export class GameModule {}
