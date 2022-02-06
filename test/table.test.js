'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Table = require('../src/table');
const table = Table(1);

describe('Streets',()=>{
    it('starts with preflop street', () => {
        expect(table.street).to.equal('preflop');
    })
})

describe('Handling of pots',()=>{
    it('starts empty, can add bet to last pot, add pots, reset pots', () => {
        expect(table.pots).to.equal([{bets: []}]);
        table.addBet(2, 50);
        table.addBet(4, 100);
        table.addPot();
        table.addBet(1, 100);
        let obj = [{bets: [
                        {playerId: 2, amount: 50},
                        {playerId: 4, amount: 100}
                    ]},
                    {bets: [
                        {playerId: 1, amount: 100}
                    ]}
                ];
        expect(table.pots).to.equal(obj);
        table.resetPots();
        expect(table.pots).to.equal([{bets: []}])
    })
})