'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Deck = require('../src/deck');
const deck = Deck(1);

describe('Deck',()=>{
    it('has 52 cards', () => {
        expect(deck.init().cardCount()).to.equal(52)
    })
})

describe('Can remove card',()=>{
    it('using take', () => {
        let card = [deck.take()];
        expect(deck.cardCount()).to.equal(51);
        expect(deck.listCards().includes(card)).to.equal(false);
    })
})