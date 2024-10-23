'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

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

function getPlayer(game){
    // This is usually done in the Handlers.js file, with authorization included
    // Here we get the active player without auth.
    return game.players[game.table.activeIndex];
}

function newTestGame(gameCode){
    let game = Repo.createGame(Table(), gameConfig, gameCode, games);
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


// describe('handles side pot craziness',()=>{
//     let game = newTestGame(Date.now());
//     // Dealer and SB have 100 chips
//     game.players[2].chips = 85; // BB has 15 less
//     game.players[3].chips = 40; // Player3 (under gun) has short stack: 40.
//     Orchestrator.startGame(game);
//     Orchestrator.actionAllIn(game, getPlayer(game)); // Player 3 is all in. D, SB, BB haven't acted

//     it('will allow a call - no side pot', () => {
//         Orchestrator.actionCall(game, getPlayer(game)); // Dealer calls - in for 40.
//         // Total is 40 + 5 + 10 + 40
//         expect(game.table.pots.length).to.equal(1);
//         expect(Utils.potTotal(game.table.pots[0])).to.equal(95);
//     })

//     it('will allow a bet and create a first side pot', () => {
//         Orchestrator.actionAllIn(game, getPlayer(game)); // Small blind goes all in - 100 in.
//         // This is a raise above previous all-in
//         // So we have a side pot:
//         // Pot1 is currently 40 + 40 + 10 + 40 = 130
//         // Pot2 is (100-40) = 60
//         expect(game.table.pots.length).to.equal(2);
//         expect(Utils.potTotal(game.table.pots[0])).to.equal(130);
//         expect(Utils.potTotal(game.table.pots[1])).to.equal(60);
//     })

//     it('will allow another, lower, all in and retroactively create a second side pot', () => {
//         // BigBlind only has 75 chips left (already has 10 in pot).
//         // BigBlind goes all in. His first 30 calls the first pot.
//         // Other 45 go against side pot (60) but can't call it fully, so...
//         // We need to pull 15 from SmallBlind out of pot 2 and create pot 3.
//         Orchestrator.actionAllIn(game, getPlayer(game));
//         expect(game.table.pots.length).to.equal(3);
//         expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
//         expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
//         expect(Utils.potTotal(game.table.pots[2])).to.equal(15);
//         // That does not complete the street, cause BigBlind has reraised
//         // Action should be to the dealer, the only person who can bet against BigBlind
//         expect(game.table.street).to.equal('preflop');
//         expect(game.table.activeIndex).to.equal(0);
//     })

//     it('will allow a fold on the last side pot and return money to the lead', () => {
//         expect(game.players[1].chips).to.equal(0); // Small blind is all in
//         Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds
//         // SmallBlind's 15 cannot be matched, so it should immediately be returned.
//         // That completes the street - no additional action allowed
//         expect(game.table.street).to.equal('flop');
//         expect(game.players[1].chips).to.equal(15); // Small blind got chips back
//         expect(game.table.pots.length).to.equal(2);
//         expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
//         expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
//     })

//     it('will allow a winner on both remaining pots', () => {
//         // starting state is Dealer folded. BigBlind and Player 3 all in. Small Blind has 15 chips left that no one can match.
//         // So no more action should be allowed. Proceed with checks for the rest of the game
//         // Main pot is: 40 for every player (BigBlind, Player 3, and Small Blind can win it)
//         // Side pot is: 45 for smallBlind and 45 for bigBlind (BigBlind and SmallBlind can win it)

//         console.log("******* Start test *******")
//         expect(game.status).to.equal('auto-advance');
//         Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen at this point.
//         expect(game.table.street).to.equal('turn');
//         Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
//         expect(game.table.street).to.equal('river');
//         /// Need to assign cards so we have a predictable result

//         game.players[1].hand = ["Th","Td"]; // SmBlind has pocket 10s
//         game.players[2].hand = ["Tc","Ts"]; // BgBLind has pocket 10s
//         game.players[3].hand = ["Ah","Ad"]; // Player3 has best hand overall
//         game.table.commonCards = ["2c","3s","5d","7h","7d"]; // Common cards don't help anyone
//         Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
//         expect(game.table.street).to.equal('showdown');
//         expect(game.players[1].chips).to.equal(60); // SmBlind wins half of top pot: 45. Plus starting chips (15) = 60
//         expect(game.players[2].chips).to.equal(45); // BgBlind wins half of top pot: 45. Plus remaining chips (0) = 45
//         expect(game.players[3].chips).to.equal(160); // Player3 wins lower pot: 160. Plus remaining chips (0) = 160;
//     })
// })

// describe('calculates side pots',()=>{
//     it('will calculate them correctly', () => {
//         expect(Orchestrator.calcSidePots([{'jeff': 15}, {'steve':10}, {'joe':25}, {'bill': 15}])).to.equal(
//             [{40: ['jeff','steve','joe','bill']},
//             {15: ['jeff', 'joe', 'bill']},
//             {10: ['joe']}
//             ]
//         )   
//     })
// })

describe('handles side pot craziness without all in to start',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    game.players[0].chips = 70; // Dealer has 30 less
    game.players[1].chips = 100; // SB has 100 chips
    game.players[2].chips = 85; // BB has 15 less
    game.players[3].chips = 40; // Player3 (under gun) has short stack: 40.
    Orchestrator.actionCall(game, getPlayer(game)); // Player 3 calls (adds 10 to pot)
    // 0 + 5 + 10 + 10
    Orchestrator.actionBet(game, getPlayer(game), 40); // D raises to push player 3 all in.
    // 40 + 5 + 10 + 10

    it('will allow a call - no side pot', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Small blind calls - 35 to match.
        // Total is 40 + 40 + 10 + 10
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(100);
    })

    it('will allow a raise larger then other players can match without yet creating a side pot', () => {
        Orchestrator.actionBet(game, getPlayer(game), 70); // Big blind goes in more then player 3 can match.
        // 40 + 40 + 80 + 10
        // Still no need for side pot since player 3 has to act. (If he folds, no side pot needed)
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(170);
        Orchestrator.actionFold(game, getPlayer(game)); // Player 3 folds
        // 40 + 40 + 80 + f10
    })

    it('will allow an all in and create a side pot', () => {
        console.log("***** new test ****");
        // Dealer only has 30 chips left (already has 40 in pot).
        // Dealer doesn't cover all 85 total chips, but small blind can, we need a dealer-BB side pot with 75 from each player
        // plus what is already in pot ()
        // Extra goes in 2nd pot -> 10 from BB. to go against sb
        Orchestrator.actionAllIn(game, getPlayer(game)); // Dealer goes all in (30 more chips)
        // 70 + 40 + 80 + f10 (call was 40, dealer all in at 30 more)
        // ordered is f10 40 70 80 - > 0 0 30 40
        expect(game.table.pots.length).to.equal(3);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(130); // D, BB, SB
        expect(Utils.potTotal(game.table.pots[1])).to.equal(60); // D, BB
        expect(Utils.potTotal(game.table.pots[2])).to.equal(10); // Return to BB
        // That does not complete the street, cause BigBlind still needs to be called by small blind
        // Action should be to the small blind
        expect(game.table.street).to.equal('preflop');
        expect(game.table.activeIndex).to.equal(1);
    })

    // it('will allow a call above the all in and recalc side pots', () => {
    //     Orchestrator.actionCall(game, getPlayer(game)); // Small blind calls with 40 chips
    //     // 70 + 80 + 80 + f10
    //     expect(game.table.pots.length).to.equal(3);
    //     expect(Utils.potTotal(game.table.pots[0])).to.equal(220); // D, BB, SB
    //     expect(Utils.potTotal(game.table.pots[1])).to.equal(20); // BB, SB
    //     // That does complete the street, next action with Dealer
    //     expect(game.table.street).to.equal('flop');
    //     expect(game.table.activeIndex).to.equal(0);
    // })

    // it('will allow a fold on the last side pot and return money to the lead', () => {
    //     expect(game.players[1].chips).to.equal(0); // Small blind is all in
    //     Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds
    //     // SmallBlind's 15 cannot be matched, so it should immediately be returned.
    //     // That completes the street - no additional action allowed
    //     expect(game.table.street).to.equal('flop');
    //     expect(game.players[1].chips).to.equal(15); // Small blind got chips back
    //     expect(game.table.pots.length).to.equal(2);
    //     expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
    //     expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
    // })

    // it('will allow a winner on both remaining pots', () => {
    //     // starting state is Dealer folded. BigBlind and Player 3 all in. Small Blind has 15 chips left that no one can match.
    //     // So no more action should be allowed. Proceed with checks for the rest of the game
    //     // Main pot is: 40 for every player (BigBlind, Player 3, and Small Blind can win it)
    //     // Side pot is: 45 for smallBlind and 45 for bigBlind (BigBlind and SmallBlind can win it)

    //     console.log("******* Start test *******")
    //     expect(game.status).to.equal('auto-advance');
    //     Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen at this point.
    //     expect(game.table.street).to.equal('turn');
    //     Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
    //     expect(game.table.street).to.equal('river');
    //     /// Need to assign cards so we have a predictable result

    //     game.players[1].hand = ["Th","Td"]; // SmBlind has pocket 10s
    //     game.players[2].hand = ["Tc","Ts"]; // BgBLind has pocket 10s
    //     game.players[3].hand = ["Ah","Ad"]; // Player3 has best hand overall
    //     game.table.commonCards = ["2c","3s","5d","7h","7d"]; // Common cards don't help anyone
    //     Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
    //     expect(game.table.street).to.equal('showdown');
    //     expect(game.players[1].chips).to.equal(60); // SmBlind wins half of top pot: 45. Plus starting chips (15) = 60
    //     expect(game.players[2].chips).to.equal(45); // BgBlind wins half of top pot: 45. Plus remaining chips (0) = 45
    //     expect(game.players[3].chips).to.equal(160); // Player3 wins lower pot: 160. Plus remaining chips (0) = 160;
    // })
})