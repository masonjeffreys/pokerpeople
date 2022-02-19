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
var players = [Player(1, "Dealer"), Player(2, "SmBnd"), Player(3, "LgBnd"), Player(4, "Jeff Mason")];
var table = Table(1);
var deck = Deck(1);

// Things that might be different from Game to Game
const gameConfig = {
    startingChips: 100,
    smallBlindAmount: 5,
    testMode: false
}

function nextStreet(currentStreet){
    return STREETS[STREETS.indexOf(currentStreet) + 1] || STREETS[0]
}

function startGame(gameConfig){
    setupNewGame(gameConfig);
    setupHand();
    return executePlayerAsk();
};

function setupNewGame(gameConfig){
    // Set up 'initial start' params (things that aren't done on every hand)
    // Set player positions at table
    // Give players chips
    // Set table blind levels

    // Seat n players from position 0..n-1, add starting chips for each player, and set bet = 0.
    players.forEach(function(player, index){
        player.chips = gameConfig["startingChips"];
        // should Player know their position? Or Table?
        player.tablePosition = index;
        table.addPlayer(player);
    });

    table.dealerPosition = -1; // We will advance this to 0 when the hand is setup
    table.smallBlind = gameConfig["smallBlindAmount"];
    table.bigBlind = 2 * gameConfig["smallBlindAmount"];
    return table;
}

function nextHand(){
    setupHand();
    return executePlayerAsk();
}

function setupHand(){
    // EVERY new hand:
    // Reset 'acted in Street' prop that indicates whether player has acted in the current street
    // Clear player hand
    // Set table street
    // Clear table common cards
    // Advance dealer position
    // Make small and big blind bets
    // Shuffle deck
    // Deal 2 cards to each active player
    
    players.forEach(function(player){
        player.actedInStreet = false;
        player.clearHand();
    })
    table.street = STREETS[0]; // Sets to 'preflop'
    table.currentHighBet = table.bigBlind;
    table.dealerPosition = Utils.nextValidPlayerIndex(players, table.dealerPosition);
    // Not sure whether to set button on player or table or both?
    // Depends how people are allowed to join/leave the game?
    players[table.dealerPosition].button = true;
    table.minRaise = table.bigBlind;
    table.clearCommonCards();

    // BetTheBlinds
    makeBlindBets();

    // Grab a new deck, shuffle, and deal  2 cards to each player
    deck.init().shuffle();
    Utils.dealOne(players, deck, table.dealerPosition + 1);
    Utils.dealOne(players, deck, table.dealerPosition + 1);
    Utils.showState(players, table)
}

function makeBlindBets(){
    // Get Indices for various players
    let smallBlindIndex = Utils.nextValidPlayerIndex(players, table.dealerPosition);
    players[smallBlindIndex].smallBlind = true;
    var bigBlindIndex = Utils.nextValidPlayerIndex(players, smallBlindIndex);
    players[bigBlindIndex].bigBlind = true;

    // Bet the small blind
    applyBet(smallBlindIndex, table.smallBlind)

    // Bet the big blind
    applyBet(bigBlindIndex, table.bigBlind)

    // Advance betting round one more time to get to active player
    // This player is 'under the gun'
    table.activeIndex = Utils.nextValidPlayerIndex(players, bigBlindIndex);
}

function applyBet(playerIndex, amount){
    // Player makes bet
    // Remove chips from player
    // Add chips to correct pot on table
    players[playerIndex].makeBet(amount);
    table.addBet(players[playerIndex].id, amount)
}

function executePlayerAsk(){
    // Ask player for action
    var player = players[table.activeIndex];
    var actionOpts = Utils.getOptions(players, player, table)
    var playersInfo = [];
    players.forEach(function(player){
        playersInfo.push({playerId: player.id,
            chips: player.chips,
            name: player.name,
            actedInStreet: player.actedInStreet,
            button: player.button,
            smallBlind:  player.smallBlind,
            bigBlind: player.bigBlind,
            gameState: player.gameState,
            handState: player.handState
        })
    })
    // Remind player of current hand table state
    return {
        table: {
            id: table.id,
            street: table.street,
            highBet: Utils.playerMaxBet(table, players),
            commonCards: table.commonCards,
            pots: Utils.potTotals(table),
            activeIndex: table.activeIndex
        },
        playersInfo: playersInfo,
        player: {
            playerId: player.id,
            hand: player.hand
        },
        actionOpts: actionOpts
    };
}

function receiveAction(action, amount = 0){
    // Get amount if needed
    var amount = parseInt(amount);
    // Get current player

    console.log("Table ID is: ", table.id);
    console.log("active index is: ", table.activeIndex);
    console.log("Action is: ", action, " : ", amount);
    var player = players[table.activeIndex]
    player.actedInStreet = true;

    // Handle player's desired action
    switch (action){
        case "bet":
            applyBet(table.activeIndex, amount);
            break
        case "check":
            // Essentially no change. Just move to next position
            break
        case "fold":
            // Change player state and advance to next position
            player.handState = "FOLD"
            break
        case "call":
            applyBet(table.activeIndex, Utils.getCallAmount(table, players, player));
            break
        default:
            throw new Error(`Invalid player action: ${action}, ${amount}`)
    }
    
    // Eval if a player won because others folded
    // Or if we need to advance the street
    // Or simply advance to the next player
    if (winByFolding() == true){
        console.log("Winner due to folding ");
    }
    else if (Utils.isStreetComplete(table, players) == true){
        console.log("Completed street: ", table.street);
        return advanceStreet();
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        console.log("Advancing to next player");
        table.activeIndex = Utils.nextValidPlayerIndex(players, table.activeIndex)
        return executePlayerAsk();
    }

}

function winByFolding(){
    if (Utils.activePlayersCount(players) == 1){
        // Winning player, others folded
        // Really should check this after every action as game would immediately end
        console.log("only 1 valid player left!")
        var winner = players.find(p => Utils.isValidPlayer(p));
        console.log("Winner: ", winner.name);
        return true;
    }
    else {
        // Do nothing, so play proceeds
        console.log("no folded win at this point");
        return false;
    }
}

function advanceStreet(){
    // Set table to next street
    table.street = nextStreet(table.street);
    console.log("New street is: ", table.street);
    // Players have not acted in this new street
    players.forEach(function(player){
        player.actedInStreet = false;
    })
    // Set starting player to 'left-of-dealer'
    table.activeIndex = Utils.nextValidPlayerIndex(players, table.dealerPosition)
    
    switch(table.street){
        case 'flop':
            table.addBurnedCard(deck.take());
            table.addCommonCard(deck.take());
            table.addCommonCard(deck.take());
            table.addCommonCard(deck.take());
            return executePlayerAsk();
            break;
        case 'turn':
            table.addBurnedCard(deck.take());
            table.addCommonCard(deck.take());
            return executePlayerAsk();
            break;
        case 'river':
            table.addBurnedCard(deck.take());
            table.addCommonCard(deck.take());
            return executePlayerAsk();
            break;
        case 'showdown':
            var handsByPlayer = [];
            var solutions = [];
            players.forEach(p => {
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
            winningPlayer.wins(Utils.potForPlayer(table, winningPlayer));
            return {
                table: null,
                player: null,
                options: null,
                results: {
                    winner_name: winningPlayer.name,
                    winning_hand: winningHand[0].descr,
                    amount: Utils.potForPlayer(table, winningPlayer)
                }
            }
            break;
        default:
            throw new Error("Invalid street could not be matched: ", table.street);
    }
}


module.exports.startGame = startGame;
module.exports.nextHand = nextHand;
module.exports.receiveAction = receiveAction;
module.exports.nextStreet = nextStreet; // only exporting for Testing...I don't like this
module.exports.setupNewGame = setupNewGame;
module.exports.setupHand = setupHand;
module.exports.gameConfig = gameConfig;