import { GameModule } from './game.module'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WalletSourceType } from '@prisma/client';
import { Address, PublicKey, SecretKey, Transaction, textEncode } from '@umi-top/umi-core-js'
import { generateMnemonic, mnemonicToSeedSync } from "bip39"

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    constructor(private readonly prismaService: PrismaService) { }
    async createUser(chatId: string, username: string): Promise<any> {
        try {
            const existingUser = await this.prismaService.user.findFirst({
                where: {
                    chatId: chatId.toString(),
                },
            });

            if (existingUser) {
                return "User exists"
            }


            const mnemonic = generateMnemonic(256)
            const seed = mnemonicToSeedSync(mnemonic)
            const secretKey = SecretKey.fromSeed(seed)
            const publicKey = secretKey.getPublicKey()
            const address1 = Address.fromKey(secretKey)
            const address2 = Address.fromKey(publicKey)
            // const seed = mnemonicToSeedSync(mnemonic)
            // const seed = new Uint8Array(12)

            const secKey = SecretKey.fromSeed(seed)
            const address = Address.fromKey(secKey).setPrefix('rod')
            const user = await this.prismaService.user.create({
                data: {
                    chatId: chatId.toString(),
                    username: username,
                    Wallets: {
                        create: [{ type: WalletSourceType.INTERNAL, address: address.getBech32() }],
                    },
                },
                include: {
                    Wallets: true,
                },
            });
            this.logger.log(`User created successfully: ${user.id}`);
            return user;
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    async replishmentWallet(chatId: string, amount: string): Promise<any> {
        try {
            const user = await this.prismaService.user.findFirst({
                where: {
                    chatId: chatId,
                },
                include: {
                    Wallets: true,
                }
            });
            const address = Address.fromBech32(user.Wallets[0].address)

            const secKey = SecretKey.fromSeed(new Uint8Array(12))
            const message = textEncode('Hello World')
            const signature = secKey.sign(message)

            // console.log(pubKey.verifySignature(signature, message))
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }
}

