import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import gameQueue from "../queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"
import { ManingStatus } from '@prisma/client';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async startGame(chatId: string) {
        console.log("startGame")
        const user = await this.getUser(chatId);

        if ((await this.getActiveManing(user))) {
            const timeRemaining = await this.getFinishTime(await this.getActiveManing(user));
            return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                    chatId: chatId.toString(),
                    messageType: "mainigTime",
                    timeRemaining: timeRemaining
                });
        }else{
            await this.prismaService.maning.create({
                data: {
                    userId: user.id,
                    finishAt: new Date(Date.now() + 6 * 3600 * 1000),
                }
            })

            return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "createGame",
            });
        } 
    }

    async getFinishTime(maning): Promise<string> {
        const currentTime = new Date();
        const finishTime = new Date(maning.finishAt);
    
        const timeDifference = finishTime.getTime() - currentTime.getTime(); // Временная разница в миллисекундах
    
        let timeRemaining: string;
        if (timeDifference >= 3600000) {
            const hours = Math.floor(timeDifference / 3600000);
            const minutes = Math.floor((timeDifference % 3600000) / 60000);
            const seconds = Math.floor((timeDifference % 60000) / 1000);
            timeRemaining = `${hours}:${minutes}:${seconds}`;
        } else if (timeDifference >= 60000) { 
            const minutes = Math.floor(timeDifference / 60000);
            const seconds = Math.floor((timeDifference % 60000) / 1000);
            timeRemaining = `${minutes}:${seconds}`;
        } else { 
            const seconds = Math.floor(timeDifference / 1000);
            timeRemaining = `${seconds} секунд`;
        }
        return timeRemaining;
    }

    async getUser(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            }
        })
        return user
    }

    async getActiveManing(user) {
        const maning = await this.prismaService.maning.findFirst({
            where: {
                User: {
                    id: user.id
                },
                status: ManingStatus.ACTIVE 
            }
        })
        return maning
    }
}

