'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Utils = require('../src/utils');
const Deck = require('../src/deck');
const Table = require('../src/table');
var players = [{id: 0, handState: "IN", hand:[]},{id: 1, handState: "OUT", hand:[]},{id: 2, handState: "IN", hand: []},{id: 3, handState: "IN", hand:[]}];
const deck = Deck(1).init();
const table = Table(1);

describe('correctIndex',()=>{
    it('will loop if needed', () => {
        expect(Utils.correctIndex(players.length, 4)).to.equal(0)
    })
    it('will start at 0 if needed', () => {
        expect(Utils.correctIndex(players.length, -2)).to.equal(0)
    })
    it('will take index if valid', () => {
        expect(Utils.correctIndex(players.length, 3)).to.equal(3)
    })
})

describe('nextValidPlayer',()=>{
    it('will get first player if -1', () => {
        expect(Utils.nextValidPlayer(players, -1).id).to.equal(0)
    })
    it('will get first player if range is too large', () => {
        expect(Utils.nextValidPlayer(players,10).id).to.equal(0)
    })
    it('will get first player if range is equal to length', () => {
        expect(Utils.nextValidPlayer(players,players.length).id).to.equal(0)
    })
    it('will skip player with handState "OUT"', () => {
        expect(Utils.nextValidPlayer(players,0).id).to.equal(2)
    })
})

describe('dealOne',()=>{
    it('each player will recieve one card', () => {
        let players2 = Utils.dealOne(players, deck, 0)
        players2.forEach(player => {
            if (player.handState == "IN"){
                console.log("player.hand ", player.hand)
                expect(player.hand.length).to.equal(1);
            } else {
                expect(player.hand.length).to.equal(0);
            }
        });
        expect(deck.listCards().length).to.equal(49)
    })
})

describe('potForPlayer',()=>{
    it('will calculated with one pot', () => {
        table.addBet(0, 15);
    })
})