'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Table = require('../../src/table');
const table = Table();

describe('Streets',()=>{
    it('starts with preflop street', () => {
        expect(table.street).to.equal('preflop');
    })
})

describe('Handling of pots',()=>{
    it('starts empty, can add bet to last pot, add pots, reset pots', () => {
        expect(table.pots).to.equal([{id: 0, playerAmounts: {}, highBet: 0}]);
    })

    it('can add bets and pots', () => {
        table.addBet(2, 50);
        table.addBet(4, 100);
        table.addPot();
        table.addBet(1, 100);
        let obj = [{id: 0,
                    highBet: 100,
                    playerAmounts: {
                        2: {amount: 50},
                        4: {amount: 100}
                        }
                    },
                    {id: 1,
                     highBet: 100,
                        playerAmounts: {
                            1: {amount: 100}
                        }
                    }
                ];
        expect(table.pots).to.equal(obj);
    })
    it('can reset pots', () => {
        table.resetPots();
        expect(table.pots).to.equal([{id: 0, playerAmounts: {}, highBet: 0}])
    })
})