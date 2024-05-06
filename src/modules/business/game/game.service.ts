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
import { WalletService } from '../wallet/wallet';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private GAME_TRANSACTION = '';
    private GAME_SESSION_TRANSACTION = [];
    private CREATOR_CARD_VALUE = 0;
    private SUBSCRIBE_CARD_VALUE = 0
    constructor(
        private readonly prismaService: PrismaService,
        private readonly walletService: WalletService
    ) { }

    async createGame(chatId: string, amount: number) {
        const user = await this.getUser(chatId);

        if (user.Wallet.WalletBalance.amountApp < amount) {
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: user.Wallet.WalletBalance.amountApp / 100
            }));
        }
        if(await this.checkBetTransaction(chatId, amount)) {
            return await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "gameExist",
                amount: amount / 100
            });
        }

        const gameTransaction = await this.prismaService.walletGameTransaction.create({
            data: {
                creatorWalletId: user.Wallet.id,
                ccy: ECcy.ROD,
                amount: amount
            }
        })

        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "createGame",
            gameTransaction: gameTransaction,
        });
    }

    async findGame(chatId: string) {
        const user = await this.getUser(chatId);

        if (!user) {
            return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "checkAvailableAmount",
                isLink: false,
            });
        }

        const transactions = await this.prismaService.walletGameTransaction.findMany({
            take: 10,
            where: {
                NOT: {
                    creatorWalletId: user.Wallet.id
                },
                subscribeWalletId: null,
                tx: null,
                winner: null
            },
            include: {
              Wallet: {
                include: {
                    user: true
                },
              }
            }
        })
     
        return await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            chatId: chatId.toString(),
            messageType: "gameList",
            transactions: transactions,
        });
    }

    async JoinGame(chatId: string, transactionId: number) {
        const subcribeUser = await this.getUser(chatId)
        const gameTransaction = await this.getGameTransaction(transactionId)

        if (!gameTransaction) {
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "gameIsOver"
            }));
        }
        
        if (subcribeUser.Wallet.WalletBalance.amountApp < gameTransaction.amount) {
            return (await gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
                chatId: chatId.toString(),
                messageType: "notEnoughTokens",
                amount: subcribeUser.Wallet.WalletBalance.amountApp / 100
            }));
        }

        const secKey = await this.sendToGameAddress();
        const cardList = await this.sendToHotAddress(secKey);
        const winner = await this.determineWinner(cardList);
        const creatorUser = await this.getCreatorUser(gameTransaction.creatorWalletId);

        const newGameTransaction = await this.saveTransactions(subcribeUser, gameTransaction, winner);

        if (winner !== EWinner.DRAW) {
            this.awardPrize(newGameTransaction);
        }

        return gameQueue(EQueue.NOTIFICATION).add(randomUUID(), {
            creatorChatId: creatorUser.chatId.toString(),
            subcribeChatId: chatId.toString(),
            messageType: "gameResult",
            creatorCard1: cardList[0],
            creatorCard2: cardList[1],
            subscribeCard1: cardList[2],
            subscribeCard2: cardList[3],
            creatorCardValue: this.CREATOR_CARD_VALUE,
            subscribeCardValue: this.SUBSCRIBE_CARD_VALUE,
            winner: winner
        });
    }

    awardPrize(gameTransaction) {
        const winner = gameTransaction.winner;
        console.log('creatorWalletId  ---  ', gameTransaction.creatorWalletId, ' subscribeWalletId  ---  ', gameTransaction.subscribeWalletId)
        const winnerWalletId = winner === EWinner.CREATOR ? gameTransaction.creatorWalletId : gameTransaction.subscribeWalletId;
        const loserWalletId = winner === EWinner.CREATOR ? gameTransaction.subscribeWalletId : gameTransaction.creatorWalletId;

        this.prismaService.$transaction(async () => {
            await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: winnerWalletId,
                        ccy: ECcy.ROD
                    }
                },
                data: {
                    amountApp: {
                        increment: gameTransaction.amount * 0.9,
                    },
                }
            });

            await this.prismaService.walletBalance.update({
                where: {
                    walletId_ccy: {
                        walletId: loserWalletId,
                        ccy: ECcy.ROD
                    }
                },
                data: {
                    amountApp: {
                        decrement: gameTransaction.amount,
                    },
                }
            });
        });
    }

    async saveTransactions(subcribeUser, walletGameTransaction, winner: EWinner) {
        return await this.prismaService.$transaction(async () => {
            const sessionTransactions = this.GAME_SESSION_TRANSACTION.map(tx => {
                return {
                    ccy: ECcy.ROD,
                    amount: 1,
                    tx: tx
                };
            });

            return await this.prismaService.walletGameTransaction.update({
                where: {
                    id: walletGameTransaction.id
                },
                data: {
                    subscribeWalletId: subcribeUser.Wallet.id,
                    tx: this.GAME_TRANSACTION,
                    winner: winner,
                    WalletGameSessionTrancation: {
                        createMany: {
                            data: sessionTransactions
                        }
                    },
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
        this.CREATOR_CARD_VALUE = await this.getCardValue([cardList[0], cardList[1]]);
        this.SUBSCRIBE_CARD_VALUE = await this.getCardValue([cardList[2], cardList[3]]);

        if (this.CREATOR_CARD_VALUE === this.SUBSCRIBE_CARD_VALUE) {
            return EWinner.DRAW;
        } else if (this.CREATOR_CARD_VALUE > this.SUBSCRIBE_CARD_VALUE) {
            return EWinner.CREATOR;
        } else {
            return EWinner.SUBSCRIBE;
        }
    }

    async sendToHotAddress(secKeyGame: SecretKey) {
        const sender = Address.fromKey(secKeyGame).setPrefix('rod').getBech32();
        const secKeyHotWallet = await this.getHotWalletSecKey();
        const recipient = Address.fromKey(secKeyHotWallet).setPrefix('rod').getBech32();

        const cardList = await this.getCardList(secKeyGame, sender, recipient);
        const winner = await this.determineWinner(cardList.map(tx => tx.card));


        for (const tx of cardList.map(tx => tx.tx)) {
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

        return cardList.map(tx => tx.card)
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

    async getGameTransaction(transactionId: number) {
        const gameTransaction = await this.prismaService.walletGameTransaction.findFirst({
            where: {
                id: transactionId,
                winner: null,
            }
        })
       
        return gameTransaction
    }

    async getCreatorUser(walletId: number) {
        const user = await this.prismaService.user.findFirst({
            where: {
                Wallet: {
                    id: walletId
                }
            },
        })

        return user
    }

    async checkBetTransaction(chatId: string, amount: number){
        const gameTransaction = await this.prismaService.walletGameTransaction.findFirst({
            where: {
                winner: null,
                tx: null,
                subscribeWalletId: null,
                amount: amount,
                Wallet: {
                    user: {
                        chatId: chatId.toString()
                    }
                }
            }
        })
        return !!gameTransaction ? true : false
    }
}

