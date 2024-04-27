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
import { ECcy } from 'src/libs/ccy/ccy.enum';
import { config } from 'src/configs/config';
import axios from 'axios';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private GAME_TRANSACTION = '';
    private GAME_SESSION_TRANSACTION = [];
    private BOT_CARD_VALUE = 0;
    private USER_CARD_VALUE = 0
    constructor(private readonly prismaService: PrismaService) { }

    async startGame(chatId: string, amount: number) {
        // const user = await this.getUser(chatId)
      
        // if (user.Wallet.WalletBalance.amountApp / 100 < amount) {
        //     return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
        //         chatId: chatId.toString(),
        //         messageType: "notEnoughTokens",
        //         amount: user.Wallet.WalletBalance.amountApp / 100
        //     }));
        // }

        const shouldBotWin = await this.shouldBotWin();
        
        // const secKey = await this.sendToGameAddress();
        // const cardList = await this.sendToHotAddress(secKey, shouldBotWin);
        // const winner = await this.determineWinner(cardList);
        
        // this.saveTransactions(user, amount * 100, winner);
        // this.awardPrize(user, amount * 100 , winner);

        // return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
        //     chatId: chatId.toString(),
        //     messageType: "gameResult",
        //     botCard1: cardList[0],
        //     botCard2: cardList[1],
        //     userCard1: cardList[2],
        //     userCard2: cardList[3],
        //     botCardValue: this.BOT_CARD_VALUE,
        //     userCardValue: this.USER_CARD_VALUE,
        //     winner: winner
        // });
    }

    awardPrize(user, amount: number, winner: EWinner) { 
        this.prismaService.$transaction(async () => {
            const transactions = await this.prismaService.walletAppTrancation.create({
                data: {
                    walletId: user.Wallet.id,
                    ccy: ECcy.ROD,
                    amount: amount,
                },
              
            })

            amount = winner === EWinner.USER ? amount : winner === EWinner.BOT ? amount * -1 : 0;
            const balance = await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: user.Wallet.id,
                        ccy: ECcy.ROD
                    }
                },
                data: {
                    amountApp: {
                        increment: amount,
                    },
                }

            })
        })
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

        })
    }

    async getCardValue(cards: string[]) {
        const cardValues = {
            '6': 6, '7': 7, '8': 8, '9': 9, '0': 10,
            'J': 2, 'Q': 3, 'K': 4, 'A': 11
        };
        let totalValue = 0;

        for (const card of cards) {
            const value = card.split('-')[0];
            totalValue += cardValues[value];
        }

        return totalValue;
    }

    async determineWinner(cardList: string[]) {
        this.BOT_CARD_VALUE = await this.getCardValue([cardList[0], cardList[1]]);
        this.USER_CARD_VALUE = await this.getCardValue([cardList[2], cardList[3]]);

        if (this.BOT_CARD_VALUE === this.USER_CARD_VALUE) {
            return EWinner.DRAW;
        } else if (this.BOT_CARD_VALUE > this.USER_CARD_VALUE) {
            return EWinner.BOT;
        } else {
            return EWinner.USER;
        }
    }

    async sendToHotAddress(secKeyGame: SecretKey, shouldBotWin: boolean) {
        const sender = Address.fromKey(secKeyGame).setPrefix('rod').getBech32();
        const secKeyHotWallet = await this.getHotWalletSecKey();
        const recipient = Address.fromKey(secKeyHotWallet).setPrefix('rod').getBech32();
        let determineWinner: EWinner;
        let txCardList: any[];

        if (shouldBotWin) {
            let winner: EWinner;
            do {
                const cardList = await this.getCardList(secKeyGame, sender, recipient);
                winner = await this.determineWinner(cardList.map(tx => tx.card));
                txCardList = cardList
            } while (winner !== EWinner.BOT);
            determineWinner = winner;
        } else {
            const cardList = await this.getCardList(secKeyGame, sender, recipient);
            txCardList = cardList
            determineWinner = await this.determineWinner(cardList.map(tx => tx.card));
        }

        for (const tx of txCardList.map(tx => tx.tx)) {
            try {
                let result: { error: { code: number; }; };
                do {
                    console.log
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


            } catch (error) {
                console.log("sendToGameAddress - error: ", error)
            }
        }

        return txCardList.map(tx => tx.card)
    }

    async getCardList(secKeyGame: SecretKey, sender: string, recipient: string) {
        let count = 0
        const cardList = []

        while (count < 4) {
            const tx = getTxNotMnemonic(secKeyGame, sender, recipient, 1, 8);

            const buffer = Buffer.from(tx, 'base64');
            const transaction = Transaction.fromBytes(buffer);
            const hash = hexEncode(transaction.getHash());

            this.GAME_SESSION_TRANSACTION.push(hash);
            cardList.push({
                tx: tx,
                card: await this.getCard(hash)
            });

            count += 1
        }

        return cardList
    }

    async getCard(tx: string) {
        const seedSum = await this.getSumFromSeed(tx);
        const cardIndex = seedSum % 36;
        const card = cards[cardIndex];
        return card;
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
        const seed = mnemonicToSeedSync(mnemonic)
        const secKey = SecretKey.fromSeed(seed)

        return secKey
    }

    async getHotWalletSecKey() {
        const seed = mnemonicToSeedSync(config.MNEMONIC)
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

    async shouldBotWin() {
        const address =  Address.fromKey(await this.getHotWalletSecKey()).setPrefix('rod').getBech32();
        const url = `https://mainnet.umi.top/api/addresses/${address}/account`;
        const response = await axios.get(url);

        if(response.data.data.confirmedBalance <= 3000){
            return true;
        }

        const walletGameTransation = await this.prismaService.walletGameTransation.groupBy({
            by: ['isWinner'],
            _sum: {
                amount: true,
            },
        });
        console.log(walletGameTransation, 'walletGameTransation')
       
        const winnerTrue = walletGameTransation.find(entry => entry.isWinner === true);
        const winnerFalse = walletGameTransation.find(entry => entry.isWinner === false);
        const botWinnCoefficient = winnerFalse._sum.amount / winnerTrue._sum.amount

        const count = await this.prismaService.walletGameTransation.count({});
        console.log(botWinnCoefficient)
        if (count < 10) {
            return true
        } else {
            return botWinnCoefficient <= config.AVAILABLE_BOT_WINNER_COEFFICIENT ? true : false
        }
    }

}

