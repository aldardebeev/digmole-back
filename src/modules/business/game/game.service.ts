import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Address, SecretKey, Transaction, hexEncode } from '@umi-top/umi-core-js'
import gameQueue from "../queue/send.job.connection";
import { randomUUID } from "crypto"
import { EQueue } from "../../../libs/queues/queue.enum"
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { getTxNotMnemonic } from '../withdrawal/test';
import { retry } from 'radash'
import { cards } from 'src/libs/cards/cards.enum';
import { EWinner } from 'src/libs/cards/winner.enum';
import { User } from '@prisma/client';
import { ECcy } from 'src/libs/ccy/ccy.enum';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private GAME_TRANSACTION = '';
    private readonly GAME_SESSION_TRANSACTION = [];
    constructor(private readonly prismaService: PrismaService) { }

    async startGame(chatId: string, amount: number) {
        const user = await this.getUser(chatId)

        if (user.Wallet.WalletBalance.amountApp < amount) {
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: user.Wallet.WalletBalance.amountApp / 100
            }));
        }

        const secKey = await this.sendToGameAddress();
        const cardList = await this.sendToHotAddress(secKey);
        const winner = await this.determineWinner(cardList);

        this.saveTransactions(user, amount * 100, winner);

        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "gameResult",
            botCard1: cardList[0],
            botCard2: cardList[1],
            userCard1: cardList[2],
            userCard2: cardList[3],
            winner: winner
        });
    }

    saveTransactions(user, amount: number, winner: EWinner) {
         this.prismaService.$transaction(async () => {
            const sessionTransactions = this.GAME_SESSION_TRANSACTION.map(tx => {
                return {
                    ccy: ECcy.ROD,
                    amount: 1,
                    tx: tx
                };
            });
            console.log("user ---  ", user, "sessionTransactions", sessionTransactions, "walletID --- ", user.Wallet.id)
            const transactions = await this.prismaService.walletGameTransation.create({
                data: {
                    walletId: user.Wallet.id,
                    ccy: ECcy.ROD,
                    amount: amount,
                    tx: this.GAME_TRANSACTION,
                    isWinner: winner === EWinner.USER ? true : false,
                    WalletGameSessionTrancation: {
                        createMany: {
                            data: sessionTransactions
                        }
                    },
                },
                include: {
                    WalletGameSessionTrancation: true
                }
            })
             const balance =await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: user.Wallet.id,
                        ccy: ECcy.ROD
                    }
                },
                data: {
                    amountApp: {
                        decrement: amount,
                    },
                }

            })
            console.log("balance --- ", balance, "transactions --- ", transactions)
        })
    }

    async getCardValue(cards: string[]) {
        const cardValues = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
        };

        let totalValue = 0;

        for (const card of cards) {
            const value = card.split('-')[0];
            totalValue += cardValues[value];
        }

        return totalValue;
    }

    async determineWinner(cardList: string[]) {
        const botCardValue = await this.getCardValue([cardList[0], cardList[1]]);
        const userCardValue = await this.getCardValue([cardList[2], cardList[3]]);

        if (botCardValue === userCardValue) {
            return EWinner.DRAW;
        } else if (botCardValue > userCardValue) {
            return EWinner.BOT;
        } else {
            return EWinner.USER;
        }
    }

    async sendToHotAddress(secKeyGame: SecretKey) {
        const sender = Address.fromKey(secKeyGame).setPrefix('rod').getBech32()

        const secKeyHotWallet = await this.getHotWalletSecKey();
        const recipient = Address.fromKey(secKeyHotWallet).setPrefix('rod').getBech32()

        let count = 0

        const cardList = []
        while (count < 4) {
            const tx = getTxNotMnemonic(secKeyGame, sender, recipient, 1, 8);

            try {
                let result: { error: { code: number; }; };
                do {
                    result = await retry(
                        { times: 10, delay: 2000 }, async () => {
                            const response = await this.sendTransactionMempool(tx);
                            const responseBody = await response.json();
                            return responseBody;
                        }
                    );

                    if (result.error && result.error.code === 400) {
                        console.log("Error: Sender account not found. Retrying...");
                    }
                } while (result.error && result.error.code === 400);

                console.log("result : ", result)
                const buffer = Buffer.from(tx, 'base64');
                const transaction = Transaction.fromBytes(buffer);
                const hash = hexEncode(transaction.getHash());

                this.GAME_SESSION_TRANSACTION.push(hash);
                cardList.push(await this.getCard(hash));
            } catch (error) {
                console.log("sendToGameAddress - error: ", error)
            }

            count += 1
        }

        return cardList
    }

    async getCard(tx: string) {
        const seedSum = await this.getSumFromSeed(tx);
        const cardIndex = seedSum % 52;
        const card = cards[cardIndex];
        return card;
        // console.log(card, hexEncode(transaction.getHash()))
    }
    async getSumFromSeed(seed: string): Promise<number> {
        let sum = 0;
        for (const char of seed) {
            sum += parseInt(char, 16);
        }
        return sum;
    }

    async sendToGameAddress() {
        const secKeyHotWallet = await this.getHotWalletSecKey();
        const sender = Address.fromKey(secKeyHotWallet).setPrefix('rod').getBech32()

        const secKeyGame = await this.getGameWalletSecKey();
        const recipient = Address.fromKey(secKeyGame).setPrefix('rod').getBech32()

        const tx = getTxNotMnemonic(secKeyHotWallet, sender, recipient, 4, 8)

        const buffer = Buffer.from(tx, 'base64');
        const transaction = Transaction.fromBytes(buffer);
        this.GAME_TRANSACTION = hexEncode(transaction.getHash());

        try {
            await retry(
                { times: 10, delay: 500 }, () => this.sendTransactionMempool(tx)
            )
        } catch (error) {
            console.log("sendToGameAddress - error: ", error)
        }

        return secKeyGame;
    }

    async sendTransactionMempool(tx: string): Promise<any> {
        return fetch('https://mainnet.umi.top/api/mempool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: tx
            })
        });
    }

    async getGameWalletSecKey() {
        const mnemonic = generateMnemonic(256)
        console.log(mnemonic)
        const seed = mnemonicToSeedSync(mnemonic)
        const secKey = SecretKey.fromSeed(seed)

        return secKey
    }

    async getHotWalletSecKey() {
        const mnemonic = `champion hybrid fat claim chicken nerve about visa limb oak great simple mirror often tomorrow program panther stamp garlic prosper couple buddy local deputy`;
        const seed = mnemonicToSeedSync(mnemonic)
        const secKey = SecretKey.fromSeed(seed)

        return secKey
    }


    async checkAvailableAmount(amountApp: number, amount: number, chatId: string) {
        if (amountApp < amount) {
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: amountApp / 100
            }));
        }
    }

    async getUser(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString(),
            },
            include: {
                Wallet: {
                    include: {
                        WalletBalance: true
                    }
                }
            }
        })
        return user
    }

}

