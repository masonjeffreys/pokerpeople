// Orchestrator is a set of methods used to control flow of the game
// and update the dumb state objects of deck, table, player

const STREETS = ['preflop', 'flop', 'turn', 'river', 'showdown', 'complete']
const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');
// const BettingRound = require('./bettingRound');
const Utils = require('./utils');
// Using a MIT license poker solver
// https://github.com/goldfire/pokersolver
const Solver = require('pokersolver').Hand;

// State definition
var street = STREETS[0];
var players = [Player(1, "Dealer"), Player(2, "SmBnd"), Player(3, "LgBnd"), Player(4, "Jeff Mason")];
var table = Table(1);
var deck = Deck(1);
var startingChips = 100;
var smallBlindAmount = 5;

function nextStreet(currentStreet){
    return STREETS[STREETS.indexOf(currentStreet) + 1] || STREETS[0]
}

function startGame(){
    setupNewGame();
    setupHand();
    return executePlayerAsk();
};

function setupNewGame(){
    // Set up 'initial start' params (things that aren't done on every hand)
    // Set player positions at table
    // Give players chips
    // Set table blind levels

    // Seat n players from position 0..n-1, add starting chips for each player, and set bet = 0.
    players.forEach(function(player, index){
        player.chips = startingChips;
        // should Player know their position? Or Table?
        player.tablePosition = index;
    });

    table.dealerPosition = -1; // We will advance this to 0 when the hand is setup
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
}

function setupHand(){
    // EVERY new hand:
    // Reset player bets.
    // Reset pot to 0
    // Advance dealer position
    // Make small and big blind bets
    // Shuffle deck
    // Deal 2 cards to each active player
    
    players.forEach(function(player){
        player.bet = 0;
    })
    table.dealerPosition = Utils.nextValidPlayerIndex(players, table.dealerPosition);
    table.pot = 0;

    // BetTheBlinds
    makeBlindBets();

    // Grab a new deck, shuffle, and deal  2 cards to each player
    deck.init().shuffle();
    Utils.dealOne(players, deck, table.dealerPosition + 1);
    Utils.dealOne(players, deck, table.dealerPosition + 1);
}

function makeBlindBets(){
    // Get Indices for various players
    let smallBlindIndex = Utils.nextValidPlayerIndex(players, table.dealerPosition);
    console.log("small blind index is ", smallBlindIndex);
    var bigBlindIndex = Utils.nextValidPlayerIndex(players, smallBlindIndex);

    // Bet the small blind
    applyBet(smallBlindIndex, table.smallBlind)

    // Bet the big blind
    applyBet(bigBlindIndex, table.bigBlind)

    // Advance betting round one more time to get to active player
    // This player is 'under the gun'
    table.activeIndex = Utils.nextValidPlayerIndex(players, bigBlindIndex);
}

function applyBet(playerIndex, amount){
    // Player makes bet first..then table is adjusted.
    players[playerIndex].makeBet(amount);
    table.pot = table.pot + amount;
}

function executePlayerAsk(){
    // Ask player for action
    player = players[table.activeIndex];
    // Remind player of current hand table state
    console.log('\n');
    console.log(`Player up: ${player.name}`);
    console.log(`Pot: ${Utils.potForPlayer(players)}`);
    console.log(`You're in ${player.bet}`);
    console.log(`Bet to you: ${table.currentBet}`);
    console.log(`Hand: ${player.hand}`);
    var actionOpts = Utils.getOptions(player, table, street)
    console.log("prompt player is")
    ret = promptPlayer(player, actionOpts);
    console.log(ret)
    return ret;
}

function promptPlayer(player, actionOpts){
    // Time to find out what the player wants to do
    // This was using readline-sync in Dev environment
    var ret = {
        player: player,
        options: actionOpts
    }
    return ret;
}

function receiveAction(action, amount = 0){
    console.log("index is", bettingRound.activeHandPlayersIndex)
    amount = parseInt(amount);
    // Get current player
    player = handPlayers[bettingRound.activeHandPlayersIndex]

    // Handle player's desired action
    switch (action){
        case "bet":
            player.makeBet(amount);
            bettingRound.addAction(player, "bet", street, amount);
            bettingRound.table.pot = bettingRound.table.pot + amount;
            break
        case "check":
            bettingRound.addAction(player, "check", street, amount);
            break
        case "fold":
            bettingRound.addAction(player, "fold", street);
            break
        case "call":
            var callAmount = bettingRound.getCallAmount(player);
            player.makeBet(callAmount);
            bettingRound.addAction(player, "call", street, callAmount);
            bettingRound.table.pot = bettingRound.table.pot + callAmount;
            break
        default:
            throw new Error(`Invalid player action: ${action}, ${amount}`)
    }
    
    // Eval if action shoud stop
    stopBetting = bettingRound.isDone;
    if (stopBetting === true){
        advanceStreet(bettingRound);
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        bettingRound.activeHandPlayersIndex = (1 + bettingRound.activeHandPlayersIndex) % handPlayers.length;
        return executePlayerAsk(bettingRound, handPlayers, bettingRound.activeHandPlayersIndex);
    }

}



function betAnotherRound(bettingRound){
    // Initialize another Betting Round. Still deciding if this bettingRound object makes sense
    var smallBlindIndex = Utils.getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    executePlayerAsk(bettingRound, handPlayers, smallBlindIndex)
}

function advanceStreet(bettingRound){
    if (bettingRound.activePlayersCount == 1){
        // Winning player, others folded
        var winner = handPlayers.find(p => p.handState == 'IN');
        console.log("Winner: ", winner.name);
        return false;
    }
    else {
        streetIndex = streetIndex + 1;
        street = STREETS[streetIndex];
        console.log("Next stage: ", STREETS[streetIndex]);
        bettingRound.street = STREETS[streetIndex];
    
        switch(street){
            case 'flop':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
                table.addCommonCard(deck.take());
                table.addCommonCard(deck.take());
                betAnotherRound(bettingRound);
            case 'turn':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
                betAnotherRound(bettingRound);
            case 'river':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
                betAnotherRound(bettingRound);
            case 'showdown':
                street = 'complete';
                var handsByPlayer = [];
                var solutions = [];
                handPlayers.forEach(p => {
                    if (p.handState == 'IN'){
                        handsByPlayer.push({player: p, hand: p.hand.concat(table.commonCards)})
                    }
                })
                
                handsByPlayer.forEach(function(h, i){
                    var solution = Solver.solve(h.hand);
                    solution.index = i;
                    solutions.push(solution);
                })
                var winningHand = Solver.winners(solutions);
                console.log("winning hand is: ", winningHand);
                var winningPlayerIndex = winningHand[0].index;
                var winningPlayer = handsByPlayer[winningPlayerIndex].player
                console.log("winner is ", winningPlayer.name);
                console.log("with hand ", winningHand[0].descr);
                winningPlayer.wins(table.pot);
                table.pot = 0;
        }
    }
}

module.exports.startGame = startGame;
module.exports.receiveAction = receiveAction;