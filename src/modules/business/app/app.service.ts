import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, PublicKey, SecretKey, Transaction } from '@umi-top/umi-core-js'

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}
  async createUser(chatId: string, username: string): Promise<any> {

        const seed = new Uint8Array(12)
        const secKey = SecretKey.fromSeed(seed)
        const address = Address.fromKey(secKey).setPrefix('rod')

    const user = await this.prismaService.user.create({
      data: {
        chatId: chatId,
        username: username,
        Wallet: {
          create: {  address: address.getBech32() },
        },
      },
      include: {
        Wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }
}
