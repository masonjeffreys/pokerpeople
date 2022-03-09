// Orchestrator is a set of methods used to control flow of the game
// and update the dumb state objects of deck, table, player

const STREETS = ['preflop', 'flop', 'turn', 'river', 'showdown', 'complete']
const Table = require('./table');
const Player = require('./player');
const Deck = require('./deck');
const Utils = require('./utils');

// Using a MIT license poker solver
// https://github.com/goldfire/pokersolver
const Solver = require('pokersolver').Hand;

function startGame(game){
    console.log("game starting now");

    // Check for at least two players?
    if (game.players.length < 2){
        throw "Less than two players. Tough to play!"
    }

    // Game state should advance to in-progress (from 'unstarted', 'in-progress', 'between-hands', 'complete')
    game.status = 'in-progress';
    setupHand(game);
}

function nextStreet(currentStreet){
    return STREETS[STREETS.indexOf(currentStreet) + 1] || STREETS[0]
}

function addPlayerToGame(game, player){
    // Seems like we shouldn't need to add player to both table and game? Maybe fix this later.
    let alreadyExists = game.players.find(
        (p) => (p.id === parseInt(player.id))
    );
    if (alreadyExists){
        console.log("player is already in the game");
        return game.players;
    } else {
        game.players.push(player);

        // Give players chips
        player.chips = game.table.startingChips;
        player.lastGameCode = game.gameCode;

        // should Player know their position? Or Table? Or Game?
        // Seat n players from position 0..n-1, add starting chips for each player
        let index = game.players.length - 1;
        player.tablePosition = index;
        return game.players;
    }
}

function nextHand(game){
    setupHand(game);
}

function setupHand(game){
    // EVERY new hand:
    // Reset 'acted in Street' prop that indicates whether player has acted in the current street
    // Clear player hand
    // Set table street
    // Clear table common cards
    // Advance dealer position
    // Make small and big blind bets
    // Shuffle deck
    // Deal 2 cards to each active player
    
    game.players.forEach(function(player){
        player.actedInStreet = false;
        player.clearHand();
        player.button = false;
        player.smallBlind = false;
        player.bigBlind = false;
        player.handState = "IN";
    })
    game.table.street = STREETS[0]; // Sets to 'preflop'
    game.table.currentHighBet = game.table.bigBlind;
    game.table.dealerPosition = Utils.nextValidPlayerIndex(game.players, game.table.dealerPosition);
    // Not sure whether to set button on player or table or both?
    // Depends how people are allowed to join/leave the game?
    game.players[game.table.dealerPosition].button = true;
    game.table.minRaise = game.table.bigBlind;
    game.table.resetPots();
    game.table.clearCommonCards();
    // Reset results
    game.results = null;

    // BetTheBlinds
    makeBlindBets(game);

    // Grab a new deck, shuffle, and deal  2 cards to each player
    game.deck.init().shuffle();
    Utils.dealOne(game.players, game.deck, game.table.dealerPosition + 1);
    Utils.dealOne(game.players, game.deck, game.table.dealerPosition + 1);
    Utils.logState(game)
}

function makeBlindBets(game){
    // Get Indices for various players
    let smallBlindIndex = Utils.nextValidPlayerIndex(game.players, game.table.dealerPosition);
    game.players[smallBlindIndex].smallBlind = true;
    var bigBlindIndex = Utils.nextValidPlayerIndex(game.players, smallBlindIndex);
    game.players[bigBlindIndex].bigBlind = true;

    // Bet the small blind
    applyBet(game, smallBlindIndex, game.table.smallBlind)

    // Bet the big blind
    applyBet(game, bigBlindIndex, game.table.bigBlind)

    // Advance betting round one more time to get to active player
    // This player is 'under the gun'
    game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, bigBlindIndex);
}

function applyBet(game, playerIndex, amount){
    // Player makes bet
    // Remove chips from player
    // Add chips to correct pot on table
    game.players[playerIndex].makeBet(amount);
    game.table.addBet(game.players[playerIndex].id, amount)
}

function receiveAction(game, action, amount = 0){
    // Get amount if needed
    var amount = parseInt(amount);
    // Get current player

    console.log("active index is: ", game.table.activeIndex);
    console.log("Action is: ", action, " : ", amount);
    var player = game.players[game.table.activeIndex]
    player.actedInStreet = true;

    // Handle player's desired action
    switch (action){
        case "bet":
            applyBet(game, game.table.activeIndex, amount);
            break
        case "check":
            // Essentially no change. Just move to next position
            break
        case "fold":
            // Change player state and advance to next position
            player.handState = "FOLD"
            break
        case "call":
            applyBet(game, game.table.activeIndex, Utils.getCallAmount(game.table, game.players, player));
            break
        default:
            throw new Error(`Invalid player action: ${action}, ${amount}`)
    }
    
    // Eval if a player won because others folded
    // Or if we need to advance the street
    // Or simply advance to the next player
    if (winByFolding(game) == true){
        console.log("Winner due to folding ");
        game.status = 'complete';
        getWinDetailsByFold(game);
    }
    else if (Utils.isStreetComplete(game.table, game.players) == true){
        console.log("Completed street: ", game.table.street);
        advanceStreet(game);
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        console.log("Advancing to next player");
        game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, game.table.activeIndex)
    }

}

function getWinDetailsByFold(game){
    var winningPlayer = game.players.find(p => Utils.isValidPlayer(p));
    console.log("Winner: ", winningPlayer.prettyName());
    winningPlayer.wins(Utils.potForPlayer(game.table, winningPlayer));
    game.results = {
        winner_name: winningPlayer.prettyName(),
        winning_hand: "not shown",
        amount: Utils.potForPlayer(game.table, winningPlayer)
    }
}

function winByFolding(game){
    if (Utils.activePlayersCount(game.players) == 1){
        // Winning player, others folded
        // Really should check this after every action as game would immediately end
        console.log("only 1 valid player left!")
        return true;
    }
    else {
        // Do nothing, so play proceeds
        console.log("no folded win at this point");
        return false;
    }
}

function advanceStreet(game){
    // Set table to next street
    game.table.street = nextStreet(game.table.street);
    console.log("New street is: ", game.table.street);
    // Players have not acted in this new street
    game.players.forEach(function(player){
        player.actedInStreet = false;
    })
    // Set starting player to 'left-of-dealer'
    game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, game.table.dealerPosition);
    
    switch(game.table.street){
        case 'flop':
            game.table.addBurnedCard(game.deck.take());
            game.table.addCommonCard(game.deck.take());
            game.table.addCommonCard(game.deck.take());
            game.table.addCommonCard(game.deck.take());
            break;
        case 'turn':
            game.table.addBurnedCard(game.deck.take());
            game.table.addCommonCard(game.deck.take());
            break;
        case 'river':
            game.table.addBurnedCard(game.deck.take());
            game.table.addCommonCard(game.deck.take());
            break;
        case 'showdown':
            var handsByPlayer = [];
            var solutions = [];
            game.players.forEach(p => {
                if (p.handState == 'IN'){
                    handsByPlayer.push({player: p, hand: p.hand.concat(game.table.commonCards)})
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
            console.log("winner is ", winningPlayer.prettyName());
            console.log("with hand ", winningHand[0].descr);
            winningPlayer.wins(Utils.potForPlayer(game.table, winningPlayer));
            game.status = 'complete';
            game.results = {
                winner_name: winningPlayer.prettyName(),
                winning_hand: winningHand[0].descr,
                amount: Utils.potForPlayer(game.table, winningPlayer)
            }
            break;
        default:
            throw new Error("Invalid street could not be matched: ", game.table.street);
    }
}

module.exports.addPlayerToGame = addPlayerToGame;
module.exports.startGame = startGame;
module.exports.nextHand = nextHand;
module.exports.setupHand = setupHand;
module.exports.receiveAction = receiveAction;
module.exports.nextStreet = nextStreet; // only exporting for Testing...I don't like this