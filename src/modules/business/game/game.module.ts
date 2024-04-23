import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { GameService } from './game.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { EQueue } from 'src/libs/queues/queue.enum';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { PrismaModule } from 'src/modules/infrastructure/prisma/prisma.module';
import { 
  StartGameWorker, CheckSignatureWorker, ReplishmentWalletWorker, WithdrawalWorker, CheckWalletWorker, BalanceWorker 
} from '../queue/game.worker';
import { ReplishmentWalletService } from '../replishment-wallet/replishment-wallet-service';
import { WithdrawalService } from '../withdrawal/withdrawal';
import { WalletService } from '../wallet/wallet';

@Module({
  imports: [
    PrismaModule,
    ...Object.values(EQueue).flatMap((queue) => [
        BullModule.registerQueue({ name: queue }),
        BullBoardModule.forFeature({ name: queue, adapter: BullMQAdapter })
    ]),
  ],
  providers: [
    GameService, ReplishmentWalletService, StartGameWorker,
    CheckSignatureWorker, ReplishmentWalletWorker, WithdrawalWorker,
    WithdrawalService, CheckWalletWorker, WalletService,
    BalanceWorker
  ],
})
export class GameModule implements OnApplicationBootstrap {
  constructor(private readonly replishmentWalletService: ReplishmentWalletService) {}

  async onApplicationBootstrap() {
    await this.replishmentWalletService.initReplishmentCheckJob();
  }
}
