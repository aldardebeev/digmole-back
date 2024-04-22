import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class WithdrawalService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async withdrawal(chatId: string, amount: number) {
        console.log('withdrawal', chatId, amount);
    }   

}

