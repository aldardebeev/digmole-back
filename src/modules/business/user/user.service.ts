import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import gameQueue from "../queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    constructor(private readonly prismaService: PrismaService) { }
    
    async createUser(chatId: string, username: string): Promise<any> {
        try {
            if (await this.getUser(chatId)) {
                console.log("userExists")
                return;
            }
            
            await this.prismaService.user.create({
                data: {
                    chatId: chatId.toString(),
                    username: username,
                    ReferralCode: {
                        create: {
                            code: randomUUID(),
                        }
                    }
                }
            });

            console.log("create")
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    private async getUser(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            },
        });
        return user;
    }  

    async balance(chatId: string){
        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "balance",
            amount: await this.getUser(chatId).then(user => user.balance)
        });
    }
}

