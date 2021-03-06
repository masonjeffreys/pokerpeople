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


describe('nextStreet',()=>{
    it('will advance street correctly', () => {
        let table = Table();
        table.street = 'preflop';
        expect(Orchestrator.nextStreet(table.street)).to.equal('flop')
    })
})

describe('can get new game ready',()=>{
    let game = newTestGame(Date.now());
    it('will initialize with correct data', () => {
        expect(game.table.street).to.equal('preflop');
        expect(game.table.pots).to.equal([{id: 0, highBet: 0, playerAmounts: {}}]);
        expect(game.players[0].prettyName()).to.equal("Dealer Man");
        expect(game.players[0].chips).to.equal(gameConfig["startingChips"]);
        expect(game.players[0].hand).to.equal([]);
    })
    it('will start with correct data', () => {
        Orchestrator.startGame(game);
        expect(game.table.dealerPosition).to.equal(0);
        expect(game.table.activeIndex).to.equal(3);
    })
})

describe('will track minRaise correctly',()=>{
    let game = newTestGame(Date.now());
    it('will start with correct data', () => {
        Orchestrator.startGame(game);
        expect(game.table.minRaise).to.equal(10);
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(10);
        Orchestrator.actionBet(game, getPlayer(game), 10 + 11 ); // UnderGun player bets 10 (call) + 11 (1 above min raise);
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(21);
        expect(game.table.minRaise).to.equal(11);
    })
})

describe('can handle a win',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    // Modify game state so we can predict winner
    game.players[1].hand = ['Ac','As']; // Small blind has pocket rockets
    game.players[2].hand = ['Ah', '2d']; // Bigblind has 1 ace and a 2
    it('in a standard game', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Under the gun calls
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds
        Orchestrator.actionBet(game, getPlayer(game), 30); // Small blind bets 30 (5 call, 25 raise).
        Orchestrator.actionBet(game, getPlayer(game), 50); // Big blind raises another 25
        Orchestrator.actionCall(game, getPlayer(game)); // Under the gun calls.
        expect(game.table.street).to.equal('preflop');
        Orchestrator.actionCall(game, getPlayer(game)); // Small blind calls. Street ends.
        expect(game.table.street).to.equal('flop');
        Orchestrator.actionBet(game, getPlayer(game), 10); // Small blind bets 10.
        Orchestrator.actionCall(game, getPlayer(game)); // Big blind calls 10.
        expect(game.table.street).to.equal('flop');
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds, ending street. Big blind and small blind are in.
        expect(game.table.street).to.equal('turn');
        // Heads up for last two cards
        Orchestrator.actionCheck(game, getPlayer(game));
        Orchestrator.actionCheck(game, getPlayer(game));
        expect(game.table.street).to.equal('river');
        // Set common cards to ensure winner
        game.table.commonCards = ['Ad','3d','6c','8h','Kc'];
        Orchestrator.actionCheck(game, getPlayer(game));
        Orchestrator.actionCheck(game, getPlayer(game));
        expect(game.table.street).to.equal('showdown');
        expect(game.status).to.equal('hand-complete');
        expect(game.results[0][0].winner_name).to.equal('Small Blind');
        expect(game.results[0][0].winning_hand).to.equal("Three of a Kind, A's");
        expect(game.results[0][0].amount).to.equal(200);
    })
})

describe('can handle a win',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    it('by all but 1 player folding', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Under the gun calls
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds
        Orchestrator.actionBet(game, getPlayer(game), 30); // Small blind raises 25
        Orchestrator.actionBet(game, getPlayer(game), 50); // Big blind raises another 25
        Orchestrator.actionCall(game, getPlayer(game)); // Under the gun calls.
        expect(game.table.street).to.equal('preflop');
        Orchestrator.actionCall(game, getPlayer(game)); // Small blind calls. Street ends.
        expect(game.table.street).to.equal('flop');
        Orchestrator.actionBet(game, getPlayer(game), 10); // Small blind bets 10.
        Orchestrator.actionCall(game, getPlayer(game)); // Big blind calls 10.
        expect(game.table.street).to.equal('flop');
        Orchestrator.actionFold(game, getPlayer(game)); // Dealer folds, ending street.
        expect(game.table.street).to.equal('turn');
        // Heads up for last two cards
        Orchestrator.actionBet(game, getPlayer(game), 10); //Small blind bets 10 
        Orchestrator.actionFold(game, getPlayer(game)); // Big blind folds. Hand is over
        expect(game.status).to.equal('muck-check');
        Orchestrator.actionMuck(game, getPlayer(game), true);
        expect(game.results[0][0].winner_name).to.equal('Small Blind');
        expect(game.results[0][0].winning_hand).to.equal("hidden");
        expect(game.results[0][0].amount).to.equal(210);
    })
})

describe('handles min bets correctly',()=>{
    let game = newTestGame(Date.now());
    // Remove chips from SmallBlind as if they have not been playing well
    game.players[1].chips = 40;
    // Remove chips from player3 so they cannot make a full raise.
    game.players[3].chips = 18;
    Orchestrator.startGame(game);

    it('will reject bets below the min raise if they are not all-in bets', () => {
        // Player tries to bet 11. (BB is 10, so they can only call 10 or go all-in with 18).
        expect(function(){Orchestrator.actionBet(game, getPlayer(game), 11)}).to.throw('Not a big enough raise. Min raise is 10 over 10 to call.');
    })
})

describe('handles everyone going all in',()=>{
    let game = newTestGame(Date.now());
    Orchestrator.startGame(game);
    Orchestrator.actionAllIn(game, getPlayer(game));
    Orchestrator.actionAllIn(game, getPlayer(game));
    Orchestrator.actionAllIn(game, getPlayer(game));
    Orchestrator.actionAllIn(game, getPlayer(game)); // Everyone is now all in. Betting is complete and game should advance to end
    expect(game.table.street).to.equal('flop');
    Orchestrator.advanceGame(game);
    Orchestrator.advanceGame(game);
    
    // Set cards to ensure dealer win
    game.players[0].hand = ["Ac","As"];
    game.players[1].hand = ["Ks","Kc"];
    game.players[2].hand = ["2c","2s"];
    game.players[3].hand = ["Ah","4c"];
    game.table.commonCards = ["Qc","Ad","7d","6d","3c"];

    // FinishGame
    Orchestrator.advanceGame(game);
    expect(game.table.street).to.equal('showdown');
    expect(game.results[0][0].winner_name).to.equal('Dealer Man');
    expect(game.results[0][0].winning_hand).to.equal("Three of a Kind, A's");
    expect(game.results[0][0].amount).to.equal(400);
})


describe('handles side pot craziness',()=>{
    let game = newTestGame(Date.now());
    // Dealer and SB have 100 chips
    game.players[2].chips = 85; // BB has 15 less
    game.players[3].chips = 40; // Player3 (under gun) has short stack: 40.
    Orchestrator.startGame(game);
    Orchestrator.actionAllIn(game, getPlayer(game)); // Player 3 is all in. D, SB, BB haven't acted

    it('will allow a call - no side pot', () => {
        Orchestrator.actionCall(game, getPlayer(game)); // Dealer calls - in for 40.
        // Total is 40 + 5 + 10 + 40
        expect(game.table.pots.length).to.equal(1);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(95);
    })

    it('will allow a bet and create a first side pot', () => {
        Orchestrator.actionAllIn(game, getPlayer(game)); // Small blind goes all in - 100 in.
        // This is a raise above previous all-in
        // So we have a side pot:
        // Pot1 is currently 40 + 40 + 10 + 40 = 130
        // Pot2 is (100-40) = 60
        expect(game.table.pots.length).to.equal(2);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(130);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(60);
    })

    it('will allow another, lower, all in and retroactively create a second side pot', () => {
        // BigBlind only has 75 chips left (already has 10 in pot).
        // BigBlind goes all in. His first 30 calls the first pot.
        // Other 45 go against side pot (60) but can't call it fully, so...
        // We need to pull 15 from SmallBlind out of pot 2 and create pot 3.
        Orchestrator.actionAllIn(game, getPlayer(game));
        expect(game.table.pots.length).to.equal(3);
        expect(Utils.potTotal(game.table.pots[0])).to.equal(160);
        expect(Utils.potTotal(game.table.pots[1])).to.equal(90);
        expect(Utils.potTotal(game.table.pots[2])).to.equal(15);
        // That does not complete the street, cause BigBlind has reraised
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