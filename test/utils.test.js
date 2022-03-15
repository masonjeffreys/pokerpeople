'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation


// Require Deck object (Singleton)
const Utils = require('../src/utils');
const Deck = require('../src/deck');
const Table = require('../src/table');
const Repo = require('../src/repo');
const Orchestrator = require('../src/orchestrator');

const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5
}

// Place to hold test players and test games
let games = [];
let players = [];

function newTestGame(gameCode){
    let game = Repo.createGame(Deck().init(), Table(), gameConfig, gameCode, games);
    let dealer = Repo.getOrCreateUser({firstName: "Dealer", lastName: "Man"}, players);
    let smallBlind = Repo.getOrCreateUser({firstName: "Small", lastName: "Blind"}, players);
    let bigBlind = Repo.getOrCreateUser({firstName: "Big", lastName: "Blind"}, players); 
    let underGun = Repo.getOrCreateUser({firstName: "First", lastName: "Action"}, players); 
    Orchestrator.addPlayerToGame(game,dealer);
    Orchestrator.addPlayerToGame(game,smallBlind);
    Orchestrator.addPlayerToGame(game,bigBlind);
    Orchestrator.addPlayerToGame(game,underGun);
    return game;
}

const deck = Deck().init();
const table = Table();

describe('correctIndex',()=>{
    let game = newTestGame("a");
    it('will loop if needed', () => {
        expect(Utils.correctIndex(game.players.length, 4)).to.equal(0)
    })
    it('will start at 0 if needed', () => {
        expect(Utils.correctIndex(game.players.length, -2)).to.equal(0)
    })
    it('will take index if valid', () => {
        expect(Utils.correctIndex(game.players.length, 3)).to.equal(3)
    })
})

describe('filteringFunction', ()=>{
    it('can filter on array and attrName and attrValue', () => {
        let answer = Utils.getByAttributeValue([{id: 1, firstName: "test"}],"id",1);
        expect(answer.firstName).to.equal("test");
    })
    it('will return undefined if there are no matches', () => {
        let answer = Utils.getByAttributeValue([{id: 1, firstName: "test"}],"id",2);
        expect(answer).to.equal(undefined);
    })
})

describe('dealOne',()=>{
    let game = newTestGame("b");
    game.players[0].handState = "IN";
    game.players[0].chips = 0;
    game.players[1].handState = "FOLD";
    game.players[1].chips = 50;
    game.players[2].handState = "IN";
    game.players[2].chips = 50;
    game.players[3].handState = "IN";
    game.players[3].chips = 50;
    it('each player will recieve one card', () => {
        expect(game.players.length).to.equal(4);
        Utils.dealOne(game.players, deck, 0);
        game.players.forEach(player => {
            if (player.handState == "IN" && player.chips > 0){
                expect(player.hand.length).to.equal(1);
            } else {
                expect(player.hand.length).to.equal(0);
            }
        });
        expect(deck.listCards().length).to.equal(50);
    })
})

describe('potTotal',()=>{
    it('will return correct amount', () => {
        table.addBet(0,15);
        table.addPot();
        table.addBet(1,20);
        expect(Utils.potTotal(table.pots[0])).to.equal(15);
        expect(Utils.potTotal(table.pots[1])).to.equal(20);
    })
})