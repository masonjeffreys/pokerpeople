'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Utils = require('../src/utils');
var players = [{id: 0, handState: "IN"},{id: 1, handState: "OUT"},{id: 2, handState: "IN"},{id: 3, handState: "IN"}];

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