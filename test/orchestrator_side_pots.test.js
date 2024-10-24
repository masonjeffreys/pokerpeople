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




describe('handles side pot craziness',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    // Dealer and SB have 100 chips
    game.players[2].chips = 75; // BB has 85 total (10 in pot)
    game.players[3].chips = 40; // Player3 (under gun) has short stack: 40.

    it('will allow a call - no side pot', () => {
        Orchestrator.actionAllIn(game, getPlayer(game)); // Player 3 is all in. D, SB, BB haven't acted
        Orchestrator.actionCall(game, getPlayer(game)); // Dealer calls - in for 40.
        // Total is 40 + 5 + 10 + 40
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(95);
    })

    it('will allow a bet and not create a side pot', () => {
        Orchestrator.actionAllIn(game, getPlayer(game)); // Small blind goes all in - 100 in.
        // This is a raise above previous all-in, so we would have a side pot except that not all players have acted
        // So we have a side pot:
        // Pot1 is currently 40 + 100 + 10 + 40 = 190
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(190);
    })

    it('will allow another, lower, all in and retroactively create a second side pot', () => {
        // BigBlind goes all in with 75 chips left (already has 10 in pot).
        // 40 + 100 + 85 + 40 
        Orchestrator.actionAllIn(game, getPlayer(game));
        expect(game.table.pots.length).to.equal(3);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
        expect(Utils.potTotal(game.table.pots[2])).to.equal(15);
        // That does not complete the street, cause SmallBlind has reraised
        // Action should be to the dealer, the only person who can bet against BigBlind
        expect(game.table.street).to.equal('preflop');
        expect(game.table.activeIndex).to.equal(0);
    })

    it('will allow a fold on the last side pot and return money to the lead', () => {
        expect(game.players[1].chips).to.equal(0); // Small blind is all in
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds
        // SmallBlind's 15 cannot be matched, so it should immediately be returned.
        // That completes the street - no additional action allowed
        expect(game.table.street).to.equal('flop');
        expect(game.players[1].chips).to.equal(15); // Small blind got chips back
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
    })

    it('will allow a winner on both remaining pots', () => {
        // starting state is Dealer folded. BigBlind and Player 3 all in. Small Blind has 15 chips left that no one can match.
        // So no more action should be allowed. Proceed with checks for the rest of the game
        // Main pot is: 40 for every player (BigBlind, Player 3, and Small Blind can win it)
        // Side pot is: 45 for smallBlind and 45 for bigBlind (BigBlind and SmallBlind can win it)

        console.log("******* Start test *******")
        expect(game.status).to.equal('auto-advance');
        Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen at this point.
        expect(game.table.street).to.equal('turn');
        Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
        expect(game.table.street).to.equal('river');
        /// Need to assign cards so we have a predictable result

        game.players[1].hand = ["Th","Td"]; // SmBlind has pocket 10s
        game.players[2].hand = ["Tc","Ts"]; // BgBLind has pocket 10s
        game.players[3].hand = ["Ah","Ad"]; // Player3 has best hand overall
        game.table.commonCards = ["2c","3s","5d","7h","7d"]; // Common cards don't help anyone
        Orchestrator.advanceGame(game); // SmBnd checks. No other play can happen.
        expect(game.table.street).to.equal('showdown');
        expect(game.players[1].chips).to.equal(60); // SmBlind wins half of top pot: 45. Plus starting chips (15) = 60
        expect(game.players[2].chips).to.equal(45); // BgBlind wins half of top pot: 45. Plus remaining chips (0) = 45
        expect(game.players[3].chips).to.equal(160); // Player3 wins lower pot: 160. Plus remaining chips (0) = 160;
    })
})

describe('handles side pot craziness without all in to start',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    game.players[0].chips = 70; // Dealer has 30 less
    game.players[1].chips = 95; // SB has 100 chips (5 are in small blind)
    game.players[2].chips = 75; // BB has 85 chips (10 are in big blind)
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

    it('will allow a call above the all in and recalc side pots', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Small blind calls with 40 chips
        // 70 + 80 + 80 + f10
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(220); // D, BB, SB
        expect(Utils.potTotal(game.table.pots[1])).to.equal(20); // BB, SB
        // That does complete the street, next action with Small Blind
        expect(game.table.street).to.equal('flop');
        expect(game.table.activeIndex).to.equal(1);
    })

    it('will allow a fold on the last side pot and return money to the lead', () => {
        expect(game.players[2].chips).to.equal(5); // Big blind is currently in for 80
        
        Orchestrator.actionFold(game, getPlayer(game)); // Small blind folds (inexplicably)
        // BigBlind's 80 cannot be matched, so 20 should be ready to be returned
        // 70 + f80 + 80 + f10
        expect(game.players[2].chips).to.equal(5 + 20); // Big blind got chips back
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(220);
        // This will end betting and advance to 'turn'
    })

    it('will allow a winner on both remaining pots', () => {
        // starting state is Dealer all in. SmallBlind and Player 3 folded. BigBlind has chips that no one can match
        // So no more action should be allowed. Proceed with checks for the rest of the game
        // Main pot is 220 winnable by Dealer or BigBlind
        console.log("******* Start test *******")
        expect(game.status).to.equal('auto-advance');
        expect(game.table.street).to.equal('turn');
        Orchestrator.advanceGame(game); // BgBnd checks. No other play can happen.
        expect(game.table.street).to.equal('river');
        /// Need to assign cards so we have a predictable result
        game.players[0].hand = ["Th","Td"]; // Dealer has pocket 10s
        game.players[2].hand = ["Ah","Ad"]; // BgBlind has best hand overall
        game.table.commonCards = ["2c","3s","5d","7h","7d"]; // Common cards don't help anyone
        Orchestrator.advanceGame(game); // BgBnd checks. No other play can happen.
        expect(game.table.street).to.equal('showdown');
        expect(game.players[0].chips).to.equal(0); // Dealer loses everything
        expect(game.players[2].chips).to.equal(245); // BgBlind wins 220 + 25 = 245
    })
})

describe('handles side pot scenario 2',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    // Dealer and SB have 100 chips
    game.players[1].chips = 30; // SB has 35 chips total (5 in pot)
    game.players[2].chips = 75; // BB has 85 total (10 in pot)
    game.players[3].chips = 40; // Player3 (under gun) has  40.

    it('will allow a call - no side pot', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Player 3 Calls. D, SB, BB haven't acted
        Orchestrator.actionCall(game, getPlayer(game)); // Dealer calls - in for 10.
        // Total is 10 + 5 + 10 + 10
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(35);
    })

    it('will allow a bet and not create a side pot', () => {
        Orchestrator.actionAllIn(game, getPlayer(game)); // Small blind goes all in - 30 more.
        // This is a raise above previous all-in, so we would have a side pot except that not all players have acted
        // So we have a side pot:
        // Pot1 is currently 10 + 35 + 10 + 10 = 65
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(65);
    })

    it('will allow another call without creating a side pot', () => {
        // BigBlind calls
        // 10 + 35 + 35 + 10
        Orchestrator.actionCall(game, getPlayer(game));
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(40);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(50);
        // That does not complete the street, cause SmallBlind has reraised
        // Action should be to Player 3, the only person who can bet against BigBlind
        expect(game.table.street).to.equal('preflop');
        expect(game.table.activeIndex).to.equal(3);
    })

    it('will allow a fold on the last side pot and return money to the lead', () => {
        Orchestrator.actionFold(game, getPlayer(game)); // Player 3 folds
        // SmallBlind's 15 cannot be matched, so it should immediately be returned.
        // That completes the street - no additional action allowed
        expect(game.table.street).to.equal('preflop');
        expect(game.table.activeIndex).to.equal(0);
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(40);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(50);
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds should go back to one pot
        // 10f 35 35 10f
        expect(game.table.street).to.equal('flop');
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(90);
    })
})

describe('handles side pot scenario 3',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    // All players have 100 chips

    it('will allow an all in', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Player 3 Calls 10. D, SB, BB haven't acted
        Orchestrator.actionBet(game, getPlayer(game), 100); // Dealer calls - in for 10.
        // Total is 100 + 5 + 10 + 10
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(125);
    })
})