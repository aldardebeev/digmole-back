// import { Injectable } from '@nestjs/common';
// import { Decks } from './decks';
// import { DeckSizeEnum } from '../utils/enums/decks/deck-size.enum';
// import { CardsEnum } from '../utils/enums/cards/cards.enum';
// import { IDeckService } from './interfaces/deck-service.interface';
// import { DeckTypeEnum } from '../utils/enums/decks/deck-type.enum';
// import { DeckRepository } from './deck.repository';

// @Injectable()
// export class DeckService implements IDeckService {
//   private readonly ABBREVIATED_DECK: Record<number, CardsEnum>;
//   private readonly FULL_DECK: Record<number, CardsEnum>;

//   constructor(private deckRepository: DeckRepository) {
//     this.ABBREVIATED_DECK = Decks.ABBREVIATED;
//     this.FULL_DECK = Decks.FULL;
//   }

//   drawCard(gameId: string): CardsEnum {
//     const deckInfo = this.deckRepository.getDeckInfo(gameId);
//     const seed = this.getSeed();
//     const seedSum = this.getSumFromSeed(seed);
//     const deckSize = this.getDeckSize(deckInfo.deckType);
//     const cardIndex = this.generateCardIndex(seedSum, deckSize);
//     const card = this.pickCard(gameId, cardIndex, deckInfo.deckType);
//     this.deckRepository.addCardInReleasedHeap(gameId, cardIndex);
//     return card;
//   }

//   generateCardIndex(seedSum: number, deckSize: DeckSizeEnum): number {
//     return seedSum % deckSize;
//   }

//   getSeed(): string {
//     const crypto = require('crypto');
//     return crypto.randomBytes(32).toString('hex');
//   }

//   getSumFromSeed(seed: string): number {
//     let sum = 0;
//     for (const char of seed) {
//       sum += parseInt(char, 16);
//     }
//     return sum;
//   }

//   getDeckSize(deckType: DeckTypeEnum): number {
//     switch (deckType) {
//       case DeckTypeEnum.FULL:
//         return DeckSizeEnum.FULL;
//       case DeckTypeEnum.ABBREVIATED:
//         return DeckSizeEnum.ABBREVIATED;
//       default:
//         return DeckSizeEnum.ABBREVIATED;
//     }
//   }

//   pickCard(
//     gameId: string,
//     cardIndex: number,
//     deckType: DeckTypeEnum,
//   ): CardsEnum {
//     switch (deckType) {
//       case DeckTypeEnum.ABBREVIATED:
//         return this.pickCardFromAbbreviatedDeck(gameId, cardIndex);
//       case DeckTypeEnum.FULL:
//         return this.pickCardFromFullDeck(gameId, cardIndex);
//       default:
//         return this.pickCardFromAbbreviatedDeck(gameId, cardIndex);
//     }
//   }

//   pickCardFromAbbreviatedDeck(gameId: string, cardIndex: number): CardsEnum {
//     const releasedCards = this.deckRepository.getDeckInfo(gameId).releasedCards;

//     if (releasedCards.length == DeckSizeEnum.ABBREVIATED) {
//       throw new Error('В колоде закончились карты!');
//     }

//     while (releasedCards.includes(cardIndex)) {
//       cardIndex += 1;
//       if (cardIndex == DeckSizeEnum.ABBREVIATED) {
//         cardIndex -= DeckSizeEnum.ABBREVIATED;
//       }
//     }

//     return this.ABBREVIATED_DECK[cardIndex];
//   }

//   pickCardFromFullDeck(gameId: string, cardIndex: number): CardsEnum {
//     const releasedCards = this.deckRepository.getDeckInfo(gameId).releasedCards;

//     if (releasedCards.length == DeckSizeEnum.FULL) {
//       throw new Error('В колоде закончились карты!');
//     }

//     while (releasedCards.includes(cardIndex)) {
//       cardIndex += 1;
//       if (cardIndex == DeckSizeEnum.FULL) {
//         cardIndex -= DeckSizeEnum.FULL;
//       }
//     }

//     return this.FULL_DECK[cardIndex];
//   }
// }