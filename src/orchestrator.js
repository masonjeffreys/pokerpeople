// Orchestrator is a set of methods used to control flow of the game
// and update the dumb state objects of deck, table, player

const STAGES = ['preflop', 'flop', 'turn', 'river', 'showdown', 'complete']

const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');
const BettingRound = require('./bettingRound');
const Utils = require('./utils');

// Using a MIT license poker solver
// https://github.com/goldfire/pokersolver
var Hand = require('pokersolver').Hand;

// const reader = require("readline-sync");
var streetIndex = 0;
var street = STAGES[0];

var players = [Player(1, "Dealer"), Player(2, "SmBnd"), Player(3, "LgBnd"), Player(4, "Jeff Mason")];

var table = Table(1);
var deck = Deck(1);
var handPlayers = [];
var handCounter = 0;
var startingChips = 100;
var smallBlindAmount = 5;
var bettingRound = null;
var minChips = 50;
var startingDealerPosition = 0 ; //we'll increment this on each deal. First deal will be 0

function startGame(){
    // Very first hand only of a new game with a new set of players.
    handCounter = 0;

    // Seat players from position 1..n, add starting chips for each player.
    players.forEach(function(player, index){
        player.chips = startingChips;
        player.tablePosition = index + 1;
    }); 

    // Dealer position starts with the first player
    table.dealerPosition = startingDealerPosition;

    // Now that the table is set up, we start a new hand!
    // We will start next rounds the same way, but increment
    // Dealer position each time
    
    var ret = newHand(table, deck, players, smallBlindAmount)
    // console.log("new hand is:");
    // console.log(ret);
    return ret
};

function newHand(table, deck, players, smallBlindAmount){
    // Every hand (which we track for curiosity):
    // reset player bets.
    // Set dealer position, blind amounts, and reset pot to 0
    handCounter = handCounter + 1;
    
    players.forEach(function(player, index){
        player.bet = 0;
    })

    table.dealerPosition = table.dealerPosition + 1;
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
    table.pot = 0;

    // Grab a new deck, shuffle, and deal
    // HandPlayers are any players that are 'ACTIVE'. Allows people to sit out a round if desired
    handPlayers = Utils.setHandPlayers(players, minChips);
    deck.init().shuffle();
    deal(2, deck, table, handPlayers);

    // Initialize a Betting Round. Still deciding if this object makes sense
    bettingRound = BettingRound(table, handPlayers, table.dealerPosition);

    // BetTheBlinds
    makeBlindBets(table, bettingRound)

    // PlayTheHand - now we need input from players!
    var ret = executePlayerAsk(bettingRound, handPlayers, bettingRound.activeHandPlayersIndex)
    // console.log("execute player ask:");
    // console.log(ret);
    return ret;
}

function makeBlindBets(table, bettingRound){
    // 
    var smallBlindIndex = Utils.getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    var bigBlindIndex = Utils.getNextHandPlayerIndex(table.dealerPosition + 1, handPlayers);
    var underGunIndex = Utils.getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers);

    // Bet the small blind.
    // Player makes bet first..then table is adjusted...then action logged
    handPlayers[smallBlindIndex].makeBet(table.smallBlind);
    bettingRound.currentBet = table.smallBlind;
    table.pot = table.pot + table.smallBlind;
    bettingRound.addAction(handPlayers[smallBlindIndex], "smallBlind", street, table.smallBlind);

    // Bet the big blind
    handPlayers[bigBlindIndex].makeBet(table.bigBlind);
    bettingRound.addAction(handPlayers[bigBlindIndex], "bigBlind", street, table.smallBlind * 2)
    bettingRound.currentBet = table.smallBlind * 2;
    table.pot = table.pot + table.bigBlind;

    // Advance betting round one more time to get to active player
    bettingRound.activeHandPlayersIndex = underGunIndex

    return bettingRound;
}

function deal(numCards, deck, table, handPlayers){
    // person after dealer gets first card
    activeHandPlayersIndex = Utils.getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    for (var i = 0; i < numCards; i++){
        for( var j=0; j < handPlayers.length; j++) {
            var pointer = (j + activeHandPlayersIndex) % handPlayers.length;
            var card = deck.take();
            var player = handPlayers[pointer];
            player.hand.push(card);
        }
    }
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
    console.log("index is", handPlayers[0].name)
    amount = parseInt(amount);
    // Get current player
    player = handPlayers[bettingRound.activeHandPlayersIndex]

    // Handle player's desired action
    if (action == 'bet'){
        player.makeBet(amount);
        bettingRound.addAction(player, "bet", street, amount);
        bettingRound.table.pot = bettingRound.table.pot + amount;
    }

    if (action == 'check'){
        bettingRound.addAction(player, "check", street, amount);
    }

    if (action == 'fold'){
        bettingRound.addAction(player, "fold", street);
    }

    if (action == 'call'){
        var callAmount = bettingRound.getCallAmount(player);
        player.makeBet(callAmount);
        bettingRound.addAction(player, "call", street, callAmount);
        bettingRound.table.pot = bettingRound.table.pot + callAmount;
    }
    else {
        throw 'Invalid player action!'
    }
    // Eval if action shoud stop
    stopBetting = bettingRound.isDone;
    if (stopBetting === true){
        console.log("This street is over!");
        return false;
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        adjustedIndex = (1 + adjustedIndex) % handPlayers.length
        promptPlayer(handPlayers[adjustedIndex]);
    }

}

function executePlayerAsk(bettingRound, handPlayers, playerHandIndex){
    // Ask player for action
    player = handPlayers[playerHandIndex];
    // Remind player of current hand table state
    console.log('\n');
    console.log(`Player up: ${player.name}`);
    console.log(`Pot: ${table.pot}`, `Bet: ${bettingRound.currentBet}`, `You're in ${player.bet}`);
    console.log(`Hand: ${player.hand}`);
    var actionOpts = bettingRound.getOptions(player, street)
    console.log("prompt player is")
    ret = promptPlayer(player, actionOpts);
    console.log(ret)
    return ret;
}

function closeRound(bettingRound){
    if (bettingRound.activePlayersCount == 1){
        // Winning player, others folded
        var winner = handPlayers.find(p => p.handState == 'IN');
        console.log("Winner: ", winner.name);
        return false;
    }
    else {
        streetIndex = streetIndex + 1;
        street = STAGES[streetIndex];
        console.log("Next stage: ", STAGES[streetIndex]);
        bettingRound.street = STAGES[streetIndex];
        return STAGES[streetIndex];
    }
}

function advanceStreet(){
 
    while (street != 'complete'){
        switch(street){
            case 'preflop':
                // Start Pre-flow with the person AFTER the big blind.
                executeBetRound(bettingRound, Utils.getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers));
                closeRound(bettingRound);
            case 'flop':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
                table.addCommonCard(deck.take());
                table.addCommonCard(deck.take());
                nextRound(table, handPlayers, bettingRound);
            case 'turn':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
                nextRound(table, handPlayers, bettingRound);
            case 'river':
                table.addBurnedCard(deck.take());
                table.addCommonCard(deck.take());
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
                    var solution = Hand.solve(h.hand);
                    solution.index = i;
                    solutions.push(solution);
                })
                var winningHand = Hand.winners(solutions);
                console.log("winning hand is: ", winningHand);
                var winningPlayerIndex = winningHand[0].index;
                var winningPlayer = handsByPlayer[winningPlayerIndex].player
                console.log("winner is ", winningPlayer.name);
                console.log("with hand ", winningHand[0].descr);
                winningPlayer.wins(table.pot);
                table.pot = 0;
        }
    }

    return 'done';
}

module.exports.startGame = startGame;
module.exports.receiveAction = receiveAction;