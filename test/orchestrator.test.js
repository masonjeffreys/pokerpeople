'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

const Deck = require('../src/deck');
const Table = require('../src/table');
const Repo = require('../src/repo');
const Orchestrator = require('../src/orchestrator');
const Utils = require('../src/utils');

const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5
}

let games = [];
let players = [];

function newTestGame(gameCode){
    let game = Repo.createGame(Deck(), Table(), gameConfig, gameCode, games);
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


// describe('nextStreet',()=>{
//     it('will advance street correctly', () => {
//         let table = Table();
//         table.street = 'preflop';
//         expect(Orchestrator.nextStreet(table.street)).to.equal('flop')
//     })
// })

// describe('can get new game ready',()=>{
//     let game = newTestGame("a");
//     it('will initialize with correct data', () => {
//         expect(game.table.street).to.equal('preflop');
//         expect(game.table.pots).to.equal([{bets: []}]);
//         expect(game.players[0].prettyName()).to.equal("Dealer Man");
//         expect(game.players[0].chips).to.equal(gameConfig["startingChips"]);
//         expect(game.players[0].hand).to.equal([]);
//     })
//     it('will start with correct data', () => {
//         Orchestrator.startGame(game);
//         expect(game.table.dealerPosition).to.equal(0);
//         expect(game.table.activeIndex).to.equal(3);
//     })
// })

// describe('handles min bets correctly',()=>{
//     let game = newTestGame("b");
//     // Remove chips from SmallBlind as if they have not been playing well
//     game.players[1].chips = 40;
//     // Remove chips from player3 so they cannot make a full raise.
//     game.players[3].chips = 18;
//     Orchestrator.startGame(game);

//     it('will reject bets below the min raise if they are not all-in bets', () => {
//         // Player tries to bet 11. (BB is 10, so they can only call 10 or go all-in with 18).
//         expect(Orchestrator.receiveAction(game, 'bet', 11)).to.throw();
//     })
// })

describe('handles standard side pot creation with full raise in same betting round',()=>{
    let game = newTestGame("c");
    // Remove chips from BB, player3
    game.players[2].chips = 85;
    game.players[3].chips = 40;
    Orchestrator.startGame(game);
    Orchestrator.receiveAction(game, 'all in'); // Player 3 is all in. D, SB, BB haven't acted

    it('will allow a call - no side pot', () => {
        Orchestrator.receiveAction(game, 'call'); // Dealer calls.
        // Total is 40 + 5 + 10 + 40
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(95);
    })

    it('will allow a bet and create a first side pot', () => {
        Orchestrator.receiveAction(game, 'all in'); // Small blind goes all in.
        // This is a raise above previous all-in
        // So we have a side pot:
        // Pot1 is currently 40 + 40 + 10 + 40 = 130
        // Pot2 is (100-40) = 60
        console.log("*** Resulting pots are ", JSON.stringify(game.table.pots));
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(130);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(60);
    })

    it('will allow another, lower, all in and retroactively create a second side pot', () => {
        // BigBlind only has 75 chips left (already has 10 in pot).
        // BigBlind goes all in. His first 30 calls the first pot.
        // Other 45 go against side pot (60) but can't call it fully, so...
        // We need to pull 15 from SmallBlind out of pot 2 and create pot 3.
        Orchestrator.receiveAction(game, 'all in');
        console.log("*** Pots are", JSON.stringify(game.table.pots));
        expect(game.table.pots.length).to.equal(3);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
        expect(Utils.potTotal(game.table.pots[2])).to.equal(15);
        // That completes the street
        // no additional action allowed since undergun player is all in already
        expect(game.table.street).to.equal('flop');
    })

    // it('will allow a bet and create a side pot', () => {
    //     Orchestrator.receiveAction(game, 'all in'); // Small blind goes all in
    //     // Pot1 is currently 40 + 40 + 10 + 40 = 130
    //     // Pot2 is (85-40) = 45
    //     expect(Utils.potTotal(game.table.pots[0])).to.equal(130);
    //     expect(Utils.potTotal(game.table.pots[1])).to.equal(45);
    //     // That completes the street - no additional action allowed since the bet wasn't full
    //     expect(game.table.street).to.equal('flop');
    //     expect().to.equal('below min raise');
    // })
})

// describe('can handle side pots',()=>{
    
//     let game2 = newTestGame("d");
//     // Remove chips from SmallBlind as if they have not been playing well
//     game2.players[1].chips = 40;
//     // Remove chips from player3 so they cannot make a full raise.
//     game2.players[2].chips = 18;
//     Orchestrator.startGame(game2);

//     it('will allow bets below minimum if they are all-in bets', () => {
//         // Player 3 calls
//         Orchestrator.receiveAction(game2, 'call');
//         // Dealer, SM blind call
//         Orchestrator.receiveAction(game2, 'call');
//         Orchestrator.receiveAction(game2, 'call');
//         // BB goes all in, but for an amount less than a full bet
//         Orchestrator.receiveAction(game2, 'all in');
//         // Pot is currently 10 + 10 + 18 + 10 = 30
//         expect(Utils.potTotal(game2.table.pots[0])).to.equal(48);
//         // That completes the street - no additional action allowed since the bet wasn't full
//         expect(game2.table.street).to.equal('flop');
//     })

//     // Resume here
//     it('will allow a side pot to start on the next betting round', () => {
//         expect(game2.table.street).to.equal('flop');
//         // SB checks, BB is out, Player3 checks
//         Orchestrator.receiveAction(game2, 'check');
//         Orchestrator.receiveAction(game2, 'check')
//         // Dealer goes all in - this creates a side pot
//         Orchestrator.receiveAction(game2, 'all in');
//         expect(game2.table.pots.length).to.equal(2)
//         // SB can raise because it was a valid bet
//         Orchestrator.receiveAction(game2, 'bet', 200);
//         // Player 3 can only call part?

//         // Dealer reraises
//         Orchestrator.receiveAction(game2, 'bet', 20);
//         // SB can't call, so we need a new side pot
//         Orchestrator.receiveAction(game2, 'call');
//         expect(game2.table.street).to.equal('turn');
//         expect(Utils.potTotal(game2.table.pots[0])).to.equal('x');
//         expect(Utils.potTotal(game2.table.pots[1])).to.equal('y');
//         expect(Utils.potTotal(game2.table.pots[1])).to.equal('z');
//     })
// })