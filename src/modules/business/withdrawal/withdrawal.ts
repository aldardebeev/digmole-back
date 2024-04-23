import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import gameQueue from "../queue/send.job.connection";
import { EQueue } from 'src/libs/queues/queue.enum';
import { randomUUID } from 'crypto';
import { Address, SecretKey, Transaction, base64Encode, hexEncode } from '@umi-top/umi-core-js';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { getTx } from './test';
@Injectable()
export class WithdrawalService {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async withdrawal(chatId: string, amount: number) {

        const tx = await this.createTransaction(chatId, amount);

        console.log(tx);

        fetch('https://mainnet.umi.top/api/mempool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: tx
/*                 jsonrpc: '2.0',
                id: '',
                method: 'sendTransaction',
                params: {
                    base64: 
                } */
            })
        }).then(function (response) {
            console.log(response.status, response.statusText)
            return response.json()
        }).then(function (json) {
            console.log('parsed json', json)
        }).catch(function (ex) {
            console.log('parsing failed', ex)
        })
    }

    async createTransaction(chatId: string, amount: number) {
        try {
            const currentAmount = amount * 100;

            const mnemonic = `champion hybrid fat claim chicken nerve about visa limb oak great simple mirror often tomorrow program panther stamp garlic prosper couple buddy local deputy`;
            const seed = mnemonicToSeedSync(mnemonic)

            const secKey = SecretKey.fromSeed(seed)
            const sender = Address.fromKey(secKey).setPrefix('rod')
            const recipientAddress = await this.getSenderAddress(chatId);

           const tx = getTx(mnemonic, sender.getBech32(), recipientAddress, 1, 8 )
            return tx;
        } catch (e: unknown) {
            console.log(e);
        }
    }

    async getSenderAddress(chatId: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                chatId: chatId.toString()
            },
            include: {
                Wallet: true
            }
        })
        return user.Wallet.address
    }

}

function Bip39SeedGenerator() {
    throw new Error('Function not implemented.');
}

function getSeed($mnemonic: any) {
    throw new Error('Function not implemented.');
}

