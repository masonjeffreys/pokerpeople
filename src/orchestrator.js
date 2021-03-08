// set of methods used to update the dumb state objects of deck, table, player
const STAGES = ['preflop', 'flop', 'turn', 'river', 'showdown']

const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');
const BettingRound = require('./bettingRound');

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
var round = 0;

function startGame(table, deck, players, startingChips, smallBlindAmount){
    // first round only, seat players and add chips.
    table.dealerPosition = 1;
    players.forEach(function(player, index){
        player.chips = startingChips;
        player.tablePosition = index + 1;
    }); 
    // start each round the same way, increment delaer position
    startRound(table, deck, players, smallBlindAmount)
};

function startRound(table, deck, players, smallBlindAmount){
    // Every round, reset bets, pots, blinds, dealer position, shuffle deck
    round = round + 1;
    players.forEach(function(player, index){
        player.bet = 0;
    })
    table.smallBlind = smallBlindAmount;
    table.bigBlind = 2 * smallBlindAmount;
    table.dealerPosition = table.dealerPosition + 1;
    table.pot = 0;
    deck.init().shuffle();
}

function setHandPlayers(players, table){
    players.forEach(function(player, index) {
        if (player.gameState == 'ACTIVE' && player.chips >= 50){
            player.handState = 'IN';
            handPlayers.push(player)
        } else {
            player.handState = 'OUT';
        }
    });
}

function getNextHandPlayerIndex(previousTablePosition, handPlayers){
    var i = handPlayers.findIndex(obj => obj.tablePosition >= previousTablePosition + 1 && obj.handState == 'IN');
    if (i == -1){
        return 0;
    } else {
        return i;
    }
}

function getCurrentPlayerIndex(tablePosition, handPlayers){
    var i = handPlayers.findIndex(obj => obj.tablePosition >= tablePosition && obj.handState == 'IN');
    if (i == -1){
        return 0;
    } else {
        return i;
    }
}

function setDealerAndBlinds(table, handPlayers){
    var i = getCurrentPlayerIndex(table.dealerPosition, handPlayers);
    handPlayers[i].button = true;
    var j = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    handPlayers[j].smallBlind = true;
    var k = getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers);
    handPlayers[k].bigBlind = true;
}

function deal(numCards, deck, table, handPlayers){
    // person after dealer gets first card
    activeHandPlayersIndex = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    for (var i = 0; i < numCards; i++){
        for( var j=0; j < handPlayers.length; j++) {
            var pointer = (j + activeHandPlayersIndex) % handPlayers.length;
            var card = deck.take();
            var player = handPlayers[pointer];
            player.hand.push(card);
        }
    }
}

function preFlopSetup(table, handPlayers){
    var smallBlindIndex = getNextHandPlayerIndex(table.dealerPosition, handPlayers);
    var bigBlindIndex = getNextHandPlayerIndex(table.dealerPosition + 1, handPlayers);
    var activeHandPlayersIndex = getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers);

    bettingRound = BettingRound(handPlayers, table, activeHandPlayersIndex);

    // add small blind. Player makes bet first..then table is adjusted...then action logged
    var smallBlindPlayer = handPlayers[smallBlindIndex];
    handPlayers[smallBlindIndex].makeBet(table.smallBlind);
    bettingRound.currentBet = table.smallBlind;
    table.pot = table.pot + table.smallBlind;
    bettingRound.addAction(handPlayers[smallBlindIndex], "smallBlind", street, table.smallBlind);

    // add big blind. I think I need callbacks here to do these in the right order
    handPlayers[bigBlindIndex].makeBet(table.bigBlind);
    bettingRound.addAction(handPlayers[bigBlindIndex], "bigBlind", street, table.smallBlind * 2)
    bettingRound.currentBet = table.smallBlind * 2;
    table.pot = table.pot + table.bigBlind;

    return bettingRound;
}

function executeBetRound(bettingRound, startPosition){

    //Infinite loop through people until betting is closed, then break
    var stopBetting = false;
    var adjustedIndex = startPosition;
    bettingRound.activeHandPlayersIndex = startPosition;

    while (true){
        // Ask player for action
        player = bettingRound.handPlayers[adjustedIndex];
        if (player.handState == 'IN'){
            // Remind player of current hand table state
            console.log('\n');
            console.log(`Player up: ${player.name}`);
            console.log(`Pot: ${table.pot}`, `Bet: ${bettingRound.currentBet}`, `You're in ${player.bet}`);
            console.log(`Hand: ${player.hand}`);
            // Prompt player based on options
            console.log('\n');
            var actionOpts = bettingRound.getOptions(player)
            // Get action from player
            //var action = reader.question(actionOpts + "\n");
            var action = "bet";
            var amount = null;
            
            if (action == 'bet'){
                amount = parseInt(20);
                player.makeBet(amount);
                bettingRound.addAction(player, "bet", street, amount);
                bettingRound.table.pot = bettingRound.table.pot + amount;
            }

            if (action == 'check'){
                bettingRound.addAction(player, "check", street, 0);
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
        }

        // Eval if action shoud stop
        stopBetting = bettingRound.isDone;
        if (stopBetting === true){
            console.log("This street is over!");
            break;
        }
        // Move to next player (check earlier in function prevents players that are out from responding)
        adjustedIndex = (1 + adjustedIndex) % bettingRound.handPlayers.length
    }
}

function closeRound(bettingRound){
    if (bettingRound.activePlayersCount == 1){
        // Winning player, others folded
        var winner = bettingRound.handPlayers.find(p => p.handState == 'IN');
        console.log("Winner: ", winner.name);
    }
    if (bettingRound.activePlayersCount > 1){
        streetIndex = streetIndex + 1;
        street = STAGES[streetIndex];
        console.log("Next stage: ", STAGES[streetIndex]);
        bettingRound.street = STAGES[streetIndex];
        return STAGES[streetIndex];
    }
}

function resetBets(table, handPlayers){
    bettingRound.currentBet = 0;
    bettingRound.isDone = false;
    handPlayers.forEach(p => {
        p.bet = 0;
    })
}

module.exports.playGame = function playGame(){
    startGame(table, deck, players, 100, 5);
    setHandPlayers(players, table);
    setDealerAndBlinds(table, handPlayers);
    deal(2, deck, table, handPlayers);
    var bettingRound = preFlopSetup(table, handPlayers);
    // Start Pre-flow with the person AFTER the big blind.
    executeBetRound(bettingRound, getNextHandPlayerIndex(table.dealerPosition + 2, handPlayers));
    var nextStreet = closeRound(bettingRound);

    if (nextStreet == 'flop'){
        table.addBurnedCard(deck.take());
        table.addCommonCard(deck.take());
        table.addCommonCard(deck.take());
        table.addCommonCard(deck.take());
    }

    // On all new rounds, reset table bet, active player bets, and start with person after the dealer
    resetBets(table, handPlayers);
    executeBetRound(bettingRound, getNextHandPlayerIndex(table.dealerPosition, handPlayers));
    nextStreet = closeRound(bettingRound);

    if (nextStreet == 'turn'){
        table.addBurnedCard(deck.take());
        table.addCommonCard(deck.take());
    }

    resetBets(table, handPlayers);
    executeBetRound(bettingRound, getNextHandPlayerIndex(table.dealerPosition, handPlayers));
    nextStreet = closeRound(bettingRound);

    if (nextStreet == 'river'){
        table.addBurnedCard(deck.take());
        table.addCommonCard(deck.take());
    }
    resetBets(table, handPlayers);
    executeBetRound(bettingRound, getNextHandPlayerIndex(table.dealerPosition, handPlayers));
    nextStreet = closeRound(bettingRound);

    if (nextStreet == 'showdown'){
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