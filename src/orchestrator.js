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

function startGame(game) {
    // Check for at least two players?
    if (game.players.length < 2) {
        console.log("Less than two players. Tough to play!")
        return;
    }
    console.log("game starting now");
    // Game state should advance to in-progress (from 'unstarted', 'in-progress', 'hand-complete', 'complete')
    // Maybe also 'muck-check' and 'auto-advance'
    game.status = 'in-progress';
    game.players.forEach(player => {
        player.gameState = "ACTIVE";
        player.chips = game.table.startingChips; // good for resetting new games
    })
    setupHand(game);
}

function nextStreet(currentStreet) {
    return STREETS[STREETS.indexOf(currentStreet) + 1] || STREETS[0]
}

function buyBackIn(game, player){
    if (player.chips <= 0 || player.gameState == "OUT"){
        player.handState = "FOLD";
        player.gameState = "IN";
    }
    player.chips = player.chips + game.table.startingChips;
}

function addPlayerToGame(game, player) {
    // Seems like we shouldn't need to add player to both table and game? Maybe fix this later.
    let alreadyExists = game.players.find(
        (p) => (p.id === parseInt(player.id))
    );
    if (alreadyExists) {
        console.log("player is already in the game");
        return game.players;
    } else {
        game.players.push(player);

        // Give players chips
        player.chips = game.table.startingChips;
        player.lastGameCode = game.gameCode;

        if (game.status == 'in-progress'){
            // Player should add as folded so that they join on the next round
            player.handState = "FOLD"
        }

        // should Player know their position? Or Table? Or Game?
        // Seat n players from position 0..n-1, add starting chips for each player
        let index = game.players.length - 1;
        player.tablePosition = index;
        return game.players;
    }
}

function nextHand(game) {
    setupHand(game);
}

bets = [{ 'jeff': 20 }, { 'andrew': 15 }]
function calcSidePots(bets) {
    var prevPotValue = 0;
    var result = []
    // Sort the bets
    var ascBets = bets.sort(function (a, b) { return Object.values(a)[0] - Object.values(b)[0] });

    for (let i = 0; i < ascBets.length; i++) {
        var playerBet = ascBets[i]; // {'jeff':30}
        var potList = [];
        var potValue = Object.values(playerBet)[0] - prevPotValue;
        console.log(prevPotValue)
        prevPotValue = potValue;

        // cycle through each player and subtract this amount if the player has that amount and add him to the pot
        for (let j = 0; j < ascBets.length; j++) {
            playerName = Object.keys(ascBets[j])[0];// name of player
            val = Object.values(playerBet)[0]; // value of bet
            console.log(playerName);

            if (Object.values(ascBets[j])[0] >= val) {
                Object.values(ascBets[j])[0] = Object.values(ascBets[j])[0] - playerBet.val;
                potList.push(playerName);
            }

        }
        console.log("pot list");
        console.log(potList);
        o = {}
        o[potValue] = potList
        result.push(o);
    }
    return result;
}

function setupHand(game) {
    // EVERY new hand:
    // Reset 'acted in Street' prop that indicates whether player has acted in the current street
    // Clear player hand
    // Set table street
    // Clear table common cards
    // Advance dealer position
    // Make small and big blind bets
    // Shuffle deck
    // Deal 2 cards to each active player

    game.players.forEach(function (player) {
        player.actedInStreet = false;
        player.clearHand();
        player.button = false;
        player.smallBlind = false;
        player.bigBlind = false;
        player.handState = "IN";
        player.publicHand = false;
    })
    game.table.street = STREETS[0]; // Sets to 'preflop'
    game.table.dealerPosition = Utils.nextValidPlayerIndex(game.players, game.table.dealerPosition);
    // Not sure whether to set button on player or table or both?
    // Depends how people are allowed to join/leave the game?
    game.players[game.table.dealerPosition].button = true;

    game.table.resetPots();
    game.table.clearCommonCards();
    // Reset results
    game.lastAction = "Dealt new hand.";
    game.results = [];
    game.freeAdvance = false;

    // Set the min bet (or min raise on top of a bet)
    // for the betting round to be equal to the big blind
    game.table.minRaise = game.table.bigBlind;

    // BetTheBlinds
    makeBlindBets(game);

    // Grab a new deck, shuffle, and deal  2 cards to each player
    game.deck.init().shuffle();
    Utils.dealOne(game.players, game.deck, game.table.dealerPosition + 1);
    Utils.dealOne(game.players, game.deck, game.table.dealerPosition + 1);
}

function makeBlindBets(game) {
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
    console.log("*** after blinds, active index is ", game.table.activeIndex);
}

function applyBet(game, playerIndex, amount) {
    // cover two scenarios
    // 1. standard bet, one pot
    // 2. bet over top of all in
    // only hit this function if player is not going all in.
    // Assume bet amount is valid per the game state before this function is called.
    // If someone is all in already, may need side pots
    let anyoneAlreadyAllIn = isSomeoneAllIn(game);
    // call amount is sum of amounts needed to call each pot
    let callAmount = Utils.getCallAmount(game.table, game.players, game.players[playerIndex]);
    let callAmounts = Utils.getCallAmounts(game.table, game.players, game.players[playerIndex]);

    let raiseAmount = amount - callAmount;
    if (raiseAmount > game.table.minRaise) {
        console.log("New min raise: ", raiseAmount);
        game.table.minRaise = raiseAmount;
    }

    game.table.addBet(game.players[playerIndex].id, amount, game.table.pots.length - 1);
    game.players[playerIndex].makeBet(amount);

    if (anyoneAlreadyAllIn){
        // might have side pots
        console.log("someone all in");
        equalizeFundsAndCreateSidePot(game);
        console.log("pots are");
        console.log(game.table.pots);
    }
}

function equalizeFundsAndCreateSidePot(game) {
    // Example: amount to call in main pot was $10 and side pot was $20. Last player can only add $15 by going all-in.
    // $15 is the allInTotal in this case
    // before this function, bet of $15 was placed at $10 in main pot, $5 in side pot

    // Desired result: main pot is called with 10, side pot 1 is reduced to a $5 side pot, and a new side pot has $15 from high raiser
    // 1. Create new side pot
    // 2. Go back through all bets in current pot. Reduce down to $15. Extra gets put in new side pot.

    // We have list of people that are all in. Also lists of bets.
    // Need a side pot for each different amount that is all-in and a final one for any extra bets

    // Do we ever need to adjust more than the current pot and the new side pot? Yes -> The nth player may go all-in with only $1
    // goal is to put player amounts in correct pots

    // All players must have acted to calc side pots
    allActed = true;
    game.players.forEach(p => {
        if (p.actedInStreet == false && p.handState != "FOLD"){
            allActed = false;
        }
    })
    if (allActed == false){
        console.log("All players haven't acted. Willl not calc sidepots");
        return;
    }

    let sortableList = [];
    game.players.forEach(player => {

        sortableList.push({ id: player.id, amount: Utils.playerCurrentBetInt(game.table, player), status: player.handState })
    })

    // Sort in ascending order
    sortableList.sort((a, b) => {
        return a.amount - b.amount;
    });

    // [
    //     { id: 4, amount: 10, status: 'FOLD' },
    //     { id: 1, amount: 40, status: 'ALLIN' },
    //     { id: 2, amount: 40, status: 'IN' },
    //     { id: 3, amount: 80, status: 'IN' }
    //   ]

    let newPots = [] // {id: 0, highBet: 10, playerAmounts: {1:{amount: 10}}}

    sortableList.forEach(p => {
        console.log("status: ", p.id, p.status, p.amount);
        if (p['status'] == "IN" || p['status'] == "ALLIN") {
            // we have an active player. with an amount e.g. 40
            playerAmounts = {}
            potAmount = p.amount;
            potTotal = 0;
            sortableList.forEach(p2 => {
                if (p2.amount == 0) {
                    // do nothing
                }
                else if (p2.amount < potAmount) {
                    // must be a folded player or another all in player
                    potTotal = potTotal + p2.amount;
                    playerAmounts[p2.id] = { amount: p2.amount }
                    p2.amount = 0;
                }
                else if (p2.amount >= potAmount) {
                    // add money to pot, take away from player, and add player in pot (if active)
                    potTotal = potTotal + potAmount;
                    p2.amount = p2.amount - potAmount;
                    playerAmounts[p2.id] = { amount: potAmount }
                    
                }

            })
            console.log("player amounts");
            console.log(playerAmounts);

            if (potTotal > 0) {
                // create new pot
                newPots.push({
                    total: potTotal,
                    id: newPots.length,
                    highBet: potAmount,
                    playerAmounts: playerAmounts
                })
            }
        }

    })

    game.table.pots = newPots;
}

function maybeReturnExtraMoney(game) {
    // A side pot has collapsed if there are 0 players who are not current with bet and still have chips and haven't folded.
    // That person gets all chips in the last pot
    let lastPot = game.table.pots[game.table.pots.length - 1];
    let lastPotBet = Utils.maxBetForPot(lastPot);
    let eligiblePlayerIds = [];
    game.players.forEach(p => {
        if (p.handState != "FOLD") {
            let playerBetInPot = Utils.playerBetForPot(lastPot, p);
            if (playerBetInPot < lastPotBet && p.chips > 0) {
                eligiblePlayerIds.push(p.id);
            } else if (playerBetInPot == lastPotBet) {
                // This would be the potential winner
                eligiblePlayerIds.push(p.id);
            }
        }
    })

    if (eligiblePlayerIds.length == 1) {
        // return bet and destroy pot
        let returnAmount = Utils.potTotal(lastPot);
        let player = game.players.find(p => p.id == eligiblePlayerIds[0]);
        console.log("Player ", player.id, " getting ", returnAmount, " back from collapsing a side pot!");
        player.chips = player.chips + returnAmount;
        game.table.pots.pop();
    } else if (eligiblePlayerIds.length == 0) {
        throw new Error('no eligible players? Bug!')
    } else {
        // No need to collapse the side pot yet
        console.log("No need to collapse side pot");
    }
    return;
}

function isSomeoneAllIn(game) {
    let anyoneAlreadyAllIn = false;
    game.players.forEach(player => {
        if (player.handState == "ALLIN") {
            anyoneAlreadyAllIn = true;
        }
    })
    return anyoneAlreadyAllIn;
}

function actionBet(game, player, amount) {
    // A bet is a first bet (when no one else has bet yet, so a raise over 0) or a raise
    // if there is another person who has bet.
    // Could be an all-in bet.
    console.log("Player ", player.id, " is betting ", amount);
    let anyoneAlreadyAllIn = isSomeoneAllIn(game);
    let callAmount = Utils.getCallAmount(game.table, game.players, player);
    let maxRaiseByOthers = Utils.maxRaiseByOthers(game.table, game.players, player);
    
    if (amount == 0) {
        // should move this to be handled by the 'check' action for more clarity.
        throw new Error("Player attempted to check, but the received action was 'bet' ");
    }
    else if (amount == callAmount) {
        // should move this to be handled by the 'call' action for more clarity.
        throw new Error("Player attempted to call, but the received action was 'bet' ");
    }
    else if (amount == player.chips){
        // player going all in. Doesn't have to meet min raise.
        actionAllIn(game, player);
    }
    else if (amount < callAmount + game.table.minRaise && amount != maxRaiseByOthers) {
        // bet wasn't large enough and is not pushing another player all in. Shouldn't be allowed.
        throw new Error("Not a big enough raise and not " + maxRaiseByOthers + ". Min raise is " + game.table.minRaise + " over " + callAmount + " to call.");
    } else if (amount > player.chips) {
        // bet was too large. Shouldn't be allowed.
        player.error = "You only have ", player.chips, " left."
    }
    else {
        // We now have a valid raise for sure!
        // If someone has already gone all-in on this pot already, we might have a side pot
        applyBet(game, game.table.activeIndex, amount);
        player.actedInStreet = true;
        advanceGame(game);
    }
    return;
}

function actionCall(game, player) {
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    applyBet(game, game.table.activeIndex, Utils.getCallAmount(game.table, game.players, player));
    advanceGame(game);
    return;
}

function actionCheck(game, player) {
    // Essentially no change. Just move to next position
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    advanceGame(game);
    return;
}

function actionFold(game, player) {
    // Change player state and advance to next position
    player.handState = "FOLD"
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    // If there are multiple pots, a fold could mean we have to give money back to a player and collapse a side pot
    if (game.table.pots.length > 1) {
        maybeReturnExtraMoney(game);
        equalizeFundsAndCreateSidePot(game)
    }
    advanceGame(game);
    return;
}

function actionMuck(game, player, muck) {
    // Winnings have already been distributed?
    // this will display results only and then move to next hand

    // if muck is false, we want to show everyone the winning hand
    // if muck is true, we only want to show the winning player the result
    game.results = calculateWinners(game);

    if (muck) {
        game.results[0][0].winning_hand = "hidden";
    }

    distributeWinnings(game, game.results);
    deactivatePlayersWithoutChips(game);
    game.status = 'hand-complete';
    game.table.activeIndex = null;
}

function actionAllIn(game, player) {
    // call amount is sum of amounts needed to call each pot
    let callAmount = Utils.getCallAmount(game.table, game.players, player);

    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;

    // Player is all in. Any bet amount is legal here.
    let amount = player.chips;
    player.handState = "ALLIN";
    game.table.playerAllIn = player.id;
    console.log("player is ", player.id);
    console.log("call amouont is ", callAmount, ", all-in pushed in ", amount);
    
    applyBet(game, game.table.activeIndex, amount);
    advanceGame(game);
}

function advanceGame(game) {
    // After a player takes some action, need to evaluate game state:

    // - hand could be over and we need to check for mucking (someone just folded)
    // - hand needs to continue but betting is over? -> cover this through normal flow
    // - street could be over
    // - OR we just need to advance to the next player

    if (winByFolding(game)) {
        game.status = 'muck-check';
        // set active index to player who needs to say whether to muck or not
        let activeId = getPlayerIdsLeft(game)[0];
        game.players.forEach(function (player, index) {
            if (player.id == activeId) {
                game.table.activeIndex = index;
            }
        })
        console.log("Time to check muck check: ", game.status);
    } else if (Utils.isBettingComplete(game.table, game.players)) {
        game.status = 'auto-advance';
        console.log("Betting complete");
        advanceStreet(game);
    } else if (Utils.isStreetComplete(game.table, game.players)) {
        console.log("Completed street: ", game.table.street);
        advanceStreet(game);
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        console.log("Advancing to next player");
        game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, game.table.activeIndex)
    }
}

function isGameComplete(game) {
    // Game is complete if game status is between-hands AND
    // only 1 player is active and still has chips
    let remainingPlayers = 0;
    game.players.forEach(function (player) {
        if (player.gameState == 'ACTIVE') {
            remainingPlayers = remainingPlayers + 1;
        }
    })
    return (remainingPlayers <= 1);
}

function winByFolding(game) {
    // If there is only 1 pot, an outright win by folding
    // occurs if allPlayersHaveActed and only 1 hasn't folded.

    // If there are side pots:
    // Folding can only collapse the last pot, not provide an outright win 
    if (game.table.pots.length == 1) {
        return (getPlayerIdsLeft(game).length == 1);
    } else {
        return false;
    }
}

function getPlayerIdsLeft(game) {
    let playersLeft = [];
    game.players.forEach(function (player) {
        if (player.handState == "FOLD") {
            console.log("Player ", player.id, " is folded.");
        } else if (player.handState == "ALLIN") {
            console.log("Player ", player.id, " is all-in.");
            playersLeft.push(player.id);
        }
        else {
            console.log("Player ", player.id, " is still active.");
            playersLeft.push(player.id);
        }
    })
    return playersLeft;
}

function advanceStreet(game) {
    // Set table to next street
    game.table.street = nextStreet(game.table.street);
    game.table.minRaise = game.table.bigBlind;
    console.log("New street is: ", game.table.street);
    game.lastAction = game.table.street.charAt(0).toUpperCase()
    + game.table.street.slice(1);
    // Players have not acted in this new street
    game.players.forEach(function (player) {
        player.actedInStreet = false;
    })
    // Set starting player to 'left-of-dealer'
    game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, game.table.dealerPosition);
    if (typeof (game.table.activeIndex) == 'undefined') {
        // no action needs to occur, just keep showing results
        console.log("can freely advance");
        game.freeAdvance = true;
    } else {
        game.freeAdvance = false;
    }

    let ret = null;

    switch (game.table.street) {
        case 'flop':
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addBurnedCard(ret.card);
            for (let i = 0; i < 3; i++) {
                ret = game.deck.take();
                game.deck = ret.deck;
                game.table.addCommonCard(ret.card);
            }
            break;
        case 'turn':
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addBurnedCard(ret.card);
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addCommonCard(ret.card);
            break;
        case 'river':
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addBurnedCard(ret.card);
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addCommonCard(ret.card);
            break;
        case 'showdown':
            // Showdown means that the hand is over, time to evaulate
            // winners based on potentially multiple pots/side pots
            game.results = calculateWinners(game);
            distributeWinnings(game, game.results); // modifies the results array
            deactivatePlayersWithoutChips(game);
            if (isGameComplete(game)) {
                game.status = 'complete';
            } else {
                game.status = 'hand-complete';
            }
            game.table.activeIndex = null;
            break;
        default:
            throw new Error("Invalid street could not be matched: ", game.table.street);
    }
}

function playerIdsInPot(pot, players) {
    let playerIdsInPot = [];
    players.forEach(function (player) {
        if (player.handState == "FOLD") {
            // player folded so they definitely can't win
        } else if (player.gameState == "ACTIVE" && Utils.playerInPot(pot, player)) {
            // player is still in (i.e. hasn't left the table)
            playerIdsInPot.push(player.id);
        } else {
            // player didn't contribute to pot or player is not active (has left table/paused)
            // they can't win the pot.
        }
    })
    return playerIdsInPot;
}

function calculateWinners(game) {
    // cycle through pots since we may have to handle multiple pots
    // game.results is an array of arrays matching with pots
    let resultsArray = [];
    game.table.pots.forEach(function (pot, index) {
        resultsArray.push(calculatePotWinner(game.table, pot, index, game.players));
    })
    return resultsArray;
}

function calculatePotWinner(table, pot, potIndex, players) {
    // for a single pot, find winner (or multiple winners for a tie)
    // need to handle win by folding as well

    let potTotal = Utils.potTotal(pot);
    let resultsList = [];

    // Get list of Ids who could win the pot (i.e. they didn't fold and they contributed money to the pot)
    let idsInPot = playerIdsInPot(pot, players);

    console.log("Potential winners of pot index ", potIndex, " are ", idsInPot);

    // First check to see if there is only 1 potential winner for this pot (others have folded)
    // Need to evaluate who wins. Could still be multiple winners if there is a tie.
    // Need to round down final answer to next whole number in case of a 0.5 chip.
    let handsByPlayer = [];
    let solutions = [];

    idsInPot.forEach(pId => {
        let player = Utils.getByAttributeValue(players, "id", pId);
        handsByPlayer.push({ player: player, hand: player.hand.concat(table.commonCards) })
    })

    handsByPlayer.forEach(function (h, i) {
        let solution = Solver.solve(h.hand);
        solution.index = i;
        solutions.push(solution);
    })

    let winningHands = Solver.winners(solutions);
    let winnersCount = winningHands.length;
    console.log("*** handsByPlayer are ", handsByPlayer);
    console.log("*** winningHands are ", winningHands);
    winningHands.forEach(function (winningHand) {
        let winningPlayer = handsByPlayer[winningHand.index].player
        let winningAmount = potTotal / winnersCount;
        resultsList.push({
            winner_id: winningPlayer.id,
            winner_name: winningPlayer.prettyName(),
            winning_hand: winningHand.descr,
            amount: winningAmount
        })
        console.log("winner is ", winningPlayer.prettyName());
        console.log("winner id is ", winningPlayer.id);
        console.log("with hand ", winningHand.descr);
        console.log("amount: ", winningAmount);
    })

    return resultsList;
}

function deactivatePlayersWithoutChips(game) {
    game.players.forEach(player => {
        if (player.chips == 0) {
            player.gameState = "OUT";
        }
    })
}

function distributeWinnings(game, resultsArray) {
    //
    resultsArray.forEach(function (potResult) {
        potResult.forEach(function (result) {
            let winningPlayer = game.players.find(p => p.id == result.winner_id);
            if (winningPlayer) {
                winningPlayer.wins(result.amount);
            } else {
                console.log("winning player not found with id ", result.winner_id);
                throw new Error('Should have had a winner!');
            }
        })
    })
}


module.exports.addPlayerToGame = addPlayerToGame;
module.exports.advanceGame = advanceGame;
module.exports.startGame = startGame;
module.exports.nextHand = nextHand;
module.exports.setupHand = setupHand;
module.exports.actionBet = actionBet;
module.exports.actionCall = actionCall;
module.exports.actionFold = actionFold;
module.exports.actionAllIn = actionAllIn;
module.exports.actionCheck = actionCheck;
module.exports.actionMuck = actionMuck;
module.exports.buyBackIn = buyBackIn;
module.exports.nextStreet = nextStreet; // only exporting for Testing...I don't like this
module.exports.calcSidePots = calcSidePots;