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
        expect(game.table.minRaise).to.equal(10); // small blind is 5, big blind is 10, so first min raise is 10 on top of the big blind
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(10);
        Orchestrator.actionBet(game, getPlayer(game), 10 + 11 ); // UnderGun player bets 10 (call) + 11 (1 above min raise);
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(21);
        expect(game.table.minRaise).to.equal(11);
    })
})

describe('will allow all-in even if less than min raise',()=>{
    let game = newTestGame(Date.now());
    it('will start with correct data', () => {
        Orchestrator.startGame(game);
        expect(game.table.minRaise).to.equal(10); // small blind is 5, big blind is 10, so first min raise is 10 on top of the big blind
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(10);
        Orchestrator.actionBet(game, getPlayer(game), 70); // UnderGun player bets 10 (call) + 11 (1 above min raise);
        expect(Utils.playerMaxBet(game.table, game.players)).to.equal(70);
        expect(game.table.minRaise).to.equal(60);
        Orchestrator.actionAllIn(game, getPlayer(game)); // all in should be allowed even if doesn't meet min raise
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
        Orchestrator.actionBet(game, getPlayer(game), 30); // Small blind bets 30 (5 call up to bigblind of 10, 25 raise). Total 35.
        expect(game.table.minRaise).to.equal(25);
        Orchestrator.actionBet(game, getPlayer(game), 50); // Big blind in for 10, 25 to call + raises another 25.
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
        expect(function(){Orchestrator.actionBet(game, getPlayer(game), 11)}).to.throw('Not a big enough raise and not 100. Min raise is 10 over 10 to call.');
    })
})

describe('handles a bet larger than other players can match',()=>{
    let game = newTestGame(Date.now());
    // Remove chips from SmallBlind as if they have not been playing well
    game.players[1].chips = 40;
    // Remove chips from bigBlind
    game.players[2].chips = 50;
    // Remove chips from Under the gun player3 so they cannot make a full raise.
    game.players[3].chips = 18;
    Orchestrator.startGame(game);
    // Player 3 calls
    Orchestrator.actionCall(game, getPlayer(game));
    // Dealer bets more than anyone can call.
    Orchestrator.actionBet(game, getPlayer(game), 90);
})

describe('handles everyone going all in',()=>{
    let game = newTestGame(Date.now());
    it('will allow everyone to go all in', () => {
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

    // // FinishGame
    Orchestrator.advanceGame(game);
    expect(game.table.street).to.equal('showdown');
    expect(game.results[0][0].winner_name).to.equal('Dealer Man');
    expect(game.results[0][0].winning_hand).to.equal("Three of a Kind, A's");
    expect(game.results[0][0].amount).to.equal(400);
    })
})