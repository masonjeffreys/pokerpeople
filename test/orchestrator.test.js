'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

const Deck = require('../src/deck');
const Table = require('../src/table');
const Repo = require('../src/repo');
const Player = require('../src/player');
const Orchestrator = require('../src/orchestrator');

const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5
}

let games = [];
let players = [];
let player0 = Repo.getOrCreateUser({firstName: "Dealer", lastName: "Man"}, players);
let player1 = Repo.getOrCreateUser({firstName: "Small", lastName: "Blind"}, players);
let player2 = Repo.getOrCreateUser({firstName: "Big", lastName: "Blind"}, players);

describe('nextStreet',()=>{
    it('will advance street correctly', () => {
        let table = Table();
        table.street = 'preflop';
        expect(Orchestrator.nextStreet(table.street)).to.equal('flop')
    })
})

describe('can get new game ready',()=>{
    it('will start with correct data', () => {
        let game = Repo.createGame(Deck(), Table(), gameConfig, "abc", games);
        Orchestrator.addPlayerToGame(game,player0);
        Orchestrator.addPlayerToGame(game,player1);
        Orchestrator.addPlayerToGame(game,player2);
        expect(game.table.street).to.equal('preflop');
        expect(game.table.pots).to.equal([{bets: []}]);
        expect(game.players[0].prettyName()).to.equal("Dealer Man");
        expect(game.players[0].chips).to.equal(gameConfig["startingChips"]);
        expect(game.players[0].hand).to.equal([]);
    })
})

describe('can handle side pots',()=>{
    it('will create a side pot', () => {
        // let table3 = Orchestrator.setupNewGame(gameConfig);
        // expect(table2.street).to.equal('preflop');
        // expect(table2.pots).to.equal([{bets: []}]);
        // let player0 = table2.players[0];
        // expect(player0.name).to.equal("Dealer");
        // expect(player0.chips).to.equal(gameConfig["startingChips"]);
        // expect(player0.hand).to.equal([]);
    })
})