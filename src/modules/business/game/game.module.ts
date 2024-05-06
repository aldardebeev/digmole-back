import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { EQueue } from 'src/libs/queues/queue.enum';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { PrismaModule } from 'src/modules/infrastructure/prisma/prisma.module';
import { 
  StartBotWorker, CheckSignatureWorker, ReplishmentWalletWorker,
  WithdrawalWorker, CheckWalletWorker, BalanceWorker,
  AvailabelAmountWorker, StartGameWorker, FindGameWorker,
  JoinGameWorker
} from '../queue/game.worker';
import { ReplishmentWalletService } from '../replishment-wallet/replishment-wallet-service';
import { WithdrawalService } from '../withdrawal/withdrawal';
import { WalletService } from '../wallet/wallet';
import { UserService } from '../user/user.service';
import { GameService } from './game.service';

@Module({
  imports: [
    PrismaModule,
    ...Object.values(EQueue).flatMap((queue) => [
        BullModule.registerQueue({ name: queue }),
        BullBoardModule.forFeature({ name: queue, adapter: BullMQAdapter })
    ]),
  ],
  providers: [
    UserService, ReplishmentWalletService, StartBotWorker,
    CheckSignatureWorker, ReplishmentWalletWorker, WithdrawalWorker,
    WithdrawalService, CheckWalletWorker, WalletService,
    BalanceWorker, AvailabelAmountWorker, StartGameWorker, GameService,
    FindGameWorker, JoinGameWorker
  ],
})
export class GameModule implements OnApplicationBootstrap {
  constructor(private readonly replishmentWalletService: ReplishmentWalletService) {}

  async onApplicationBootstrap() {
    await this.replishmentWalletService.initReplishmentCheckJob();
  }
}
