// @ts-nocheck

import  * as umi from '@umi-top/umi-core-js'
import * as bip39 from 'bip39';

const sha256K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2,
]

function sha256(message) {
    const h = [
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
    ]
    const chunks = sha256PreProcess(message)
    for (let j = 0, l = chunks.length; j < l; j++) {
        const w = chunks[j]
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
            w[i] = w[i - 16] + s0 + w[i - 7] + s1
        }
        sha256Block(h, w)
    }
    const digest = []
    for (let i = 0; i < 8; i++) {
        digest[digest.length] = (h[i] >>> 24) & 0xff
        digest[digest.length] = (h[i] >>> 16) & 0xff
        digest[digest.length] = (h[i] >>> 8) & 0xff
        digest[digest.length] = h[i] & 0xff
    }
    return digest
}

function sha256PreProcess(message) {
    const bytez = []
    let i
    let l
    for (i = 0, l = message.length + 8 + (64 - ((message.length + 8) % 64)); i < l; i++) {
        bytez[i] = message[i] || 0
    }
    bytez[message.length] = 0x80
    bytez[bytez.length - 2] = ((message.length * 8) >>> 8) & 0xff
    bytez[bytez.length - 1] = (message.length * 8) & 0xff
    const chunks = []
    for (i = 0, l = bytez.length; i < l; i += 64) {
        const chunk = []
        for (let j = 0; j < 64; j += 4) {
            let n = i + j
            chunk[chunk.length] = (bytez[n] << 24) + (bytez[++n] << 16) + (bytez[++n] << 8) + bytez[++n]
        }
        chunks[chunks.length] = chunk
    }
    return chunks
}

function sha256Block(h, w) {
    const a = []
    let i
    for (i = 0; i < 8; i++) {
        a[i] = h[i]
    }
    for (i = 0; i < 64; i++) {
        const S1 = rotr(a[4], 6) ^ rotr(a[4], 11) ^ rotr(a[4], 25)
        const ch = (a[4] & a[5]) ^ (~a[4] & a[6])
        const t1 = a[7] + S1 + ch + sha256K[i] + w[i]
        const S0 = rotr(a[0], 2) ^ rotr(a[0], 13) ^ rotr(a[0], 22)
        const ma = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2])
        const t2 = S0 + ma
        a[7] = a[6]
        a[6] = a[5]
        a[5] = a[4]
        a[4] = a[3] + t1
        a[3] = a[2]
        a[2] = a[1]
        a[1] = a[0]
        a[0] = t1 + t2
    }
    for (i = 0; i < 8; i++) {
        h[i] = (h[i] + a[i]) | 0
    }
}

function rotr(n, i) {
    return (n >>> i) | (n << (32 - i))
}

function getInfoFromMnemo(_mnemo) {
    const seed2 = bip39.mnemonicToSeedSync(_mnemo)
    const seed32 = sha256(seed2)
    const secKey2 = umi.SecretKey.fromSeed(seed2)
    const secKey32 = umi.SecretKey.fromSeed(seed32)
    const addressWithPrefix = umi.Address.fromKey(secKey2).setPrefix('umi')
    const addressWithPrefix2 = umi.Address.fromKey(secKey2).setPrefix('glz')
    const addressWithPrefix3 = umi.Address.fromKey(secKey2).setPrefix('gls')
    const addressWithPrefix4 = umi.Address.fromKey(secKey2).setPrefix('rod')
    const address = umi.Address.fromKey(secKey2)
    return {
        seed2,
        seed32,
        secKey2,
        secKey32,
        addressWithPrefix,
        addressWithPrefix2,
        addressWithPrefix3,
        addressWithPrefix4,
        address,
    }
}

function arrayNew(length) {
    const a = []
    for (let i = 0; i < length; i++) {
        a[i] = 0
    }
    return a
}

function arraySet(a, b, offset, length) {
    const o = offset || 0
    const l = length || b.length
    for (let i = 0; i < l; i++) {
        a[o + i] = b[i]
    }
}

function uint64ToBytes(value) {
    const l = (value >>> 24) * 16777216 + (value & 0x00ffffff)
    const h = (value - l) / 4294967296
    return [
        (h >> 24) & 0xff,
        (h >> 16) & 0xff,
        (h >> 8) & 0xff,
        h & 0xff,
        (l >> 24) & 0xff,
        (l >> 16) & 0xff,
        (l >> 8) & 0xff,
        l & 0xff,
    ]
}

function uint32(v) {
    const bytes = []
    for (let i = 0; i < 4; i++) {
        bytes[i] = (v >> (8 * i)) & 0xff
    }
    const buf = Buffer.allocUnsafe(4)

    buf.writeUInt32BE(v, 0)
    return buf
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

/**
 * @description              - Метод формирования TX для отправки в мемпул
 * @param {string} mnemonic  - Мнемоника отправителя
 * @param {string} sender    - Кошелек отправителя (в Bench32)
 * @param {string} recipient - Кошелек получателя (в Bench32)
 * @param {number} amount    - Сумма (Уже умноженная на 100)
 * @param {number} version   - Версия транзакции
 * @param {number} timestamp - Текущий timestamp для отправки (возьмется текущее клиентское, если не передать)
 */
export function getTx(mnemonic,
               sender,
               recipient,
               amount,
               version = 8,
               timestamp = new Date().getTime() / 1000) {
    const data = getInfoFromMnemo(mnemonic)
    const bytes = arrayNew(86)
    bytes[0] = version // version transaction
    arraySet(bytes, umi.Address.fromBech32(sender).getBytes(), 1, 34)
    arraySet(bytes, recipient ? umi.Address.fromBech32(recipient).getBytes() : arrayNew(34), 35)
    arraySet(bytes, uint64ToBytes(amount), 69) // amount
    arraySet(bytes, uint32(Math.floor(timestamp)), 77) // timestamp
    arraySet(bytes, uint32(getRandomInt(9999)), 81) // nonce
    const signs = umi.SecretKey.fromSeed(data.seed32).sign(bytes) // sign
    const txBytes = arrayNew(150)
    arraySet(txBytes, bytes)
    arraySet(txBytes, signs, 86)
    return Buffer.from(txBytes).toString('base64') // NASH RESULT
}
export function getTxNotMnemonic(secKey,
    sender,
    recipient,
    amount,
    version = 8,
    timestamp = new Date().getTime() / 1000) {
const bytes = arrayNew(86)
bytes[0] = version // version transaction
arraySet(bytes, umi.Address.fromBech32(sender).getBytes(), 1, 34)
arraySet(bytes, recipient ? umi.Address.fromBech32(recipient).getBytes() : arrayNew(34), 35)
arraySet(bytes, uint64ToBytes(amount), 69) // amount
arraySet(bytes, uint32(Math.floor(timestamp)), 77) // timestamp
arraySet(bytes, uint32(getRandomInt(9999)), 81) // nonce
const signs = secKey.sign(bytes) // sign
const txBytes = arrayNew(150)
arraySet(txBytes, bytes)
arraySet(txBytes, signs, 86)
return Buffer.from(txBytes).toString('base64') // NASH RESULT
}
