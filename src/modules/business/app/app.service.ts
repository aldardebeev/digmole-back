import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WalletSourceType } from '@prisma/client';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}
  async getHello(): Promise<any> {
    const user = await this.prismaService.user.create({
      data: {
        Wallets: {
          create: [{ type: WalletSourceType.INTERNAL, address: 'sfasfasfsaf' }],
        },
      },
      include: {
        Wallets: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }
}
