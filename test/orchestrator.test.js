'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

const Table = require('../src/table');
const Player = require('../src/player');
const Orchestrator = require('../src/orchestrator');
const table = Table(1);

const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5
}

describe('nextStreet',()=>{
    it('will advance street correctly', () => {
        table.street = 'preflop';
        expect(Orchestrator.nextStreet(table.street)).to.equal('flop')
    })
})

describe('can get new game ready',()=>{
    it('will start with correct data', () => {
        let table2 = Orchestrator.setupNewGame(gameConfig);
        expect(table2.street).to.equal('preflop');
        expect(table2.pots).to.equal([{bets: []}]);
        let player0 = table2.players[0];
        expect(player0.name).to.equal("Dealer");
        expect(player0.chips).to.equal(gameConfig["startingChips"]);
        expect(player0.hand).to.equal([]);
    })
})