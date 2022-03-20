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

    // Game state should advance to in-progress (from 'unstarted', 'in-progress', 'hand-complete', 'complete')
    // Maybe also 'muck-check' and 'auto-advance'
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
    game.lastAction = "new hand";
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
    console.log("*** after blinds, active index is ", game.table.activeIndex);
}

function applyBet(game, playerIndex, amount){
    // Assume bet amount is valid per the game state before this function is called.

    // Player makes bet
    // Remove chips from player
    // Add chips to correct pots on table
    let callAmounts = Utils.getCallAmounts(game.table, game.players, game.players[playerIndex]); // array of callAmounts by Pot
    let callAmount = Utils.getCallAmount(game.table, game.players, game.players[playerIndex]); // single call amount
    console.log("Call amounts by pot are: ", callAmounts);
    console.log("Placing bet of: ", amount);
    
    let raiseAmount = amount - callAmount;
    if (raiseAmount > game.table.minRaise){
        console.log("New min raise: ", raiseAmount);
        game.table.minRaise = raiseAmount; 
    }

    let amountRemaining = amount;
    callAmounts.forEach(function(ca,index){
        if (index == game.table.pots.length - 1 && amountRemaining > 0){
            // last Pot. Drop all money here
            console.log("option 1");
            game.table.addBet(game.players[playerIndex].id, amountRemaining, index);
            amountRemaining = 0;
        } else if (ca > 0 && amountRemaining >= ca){
            console.log("option 2");
            // Need to call the pot and can make the call
            game.table.addBet(game.players[playerIndex].id, ca, index);
            amountRemaining = amountRemaining - ca;
        } else if (ca == 0){
            // if call amount is 0, don't add anything. (except if it's the last pot which will be caught by option 1)
            console.log("option 3");
        } else if (amountRemaining > 0){
            console.log("option 4");
            // not the last pot, but can't cover the call. Drop all money here
            // also triggered if call amount is 0
            game.table.addBet(game.players[playerIndex].id, amountRemaining, index);
            amountRemaining = 0;
        } else if (amountRemaining == 0) {
            console.log("option 5");
            // no amountRemaining is so we Do nothing.
        } else {
            console.log("option 6");
            throw new Error("Weird. Would not expect to hit this.")
        }
    })
    game.players[playerIndex].makeBet(amount);
}

function equalizeFundsAndCreateSidePot(game, allInTotal){
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
    
    let playerCurrentBets = {}; // object of playerCurrentBets

    let sortableList = [];
    game.players.forEach(player=>{
        playerCurrentBets[player.id] = {amount: Utils.playerCurrentBetInt(game.table, player)};
        sortableList.push({id: player.id, amount: Utils.playerCurrentBetInt(game.table, player)})
    })

    // Sort in ascending order
    sortableList.sort((a, b) => {
        return a.amount - b.amount;
    });

    let newPots = [] // {id: 0, highBet: 10, playerAmounts: {1:{amount: 10}}}

    sortableList.forEach(i => {
        let pcb = playerCurrentBets[i.id];
        // Go through objects like  2: {amount: 10}, 3: {amount: 10}, 8: {amount: 40}
        // if pot already exists for this amount, contribute to that pot
        let amountRemaining = pcb.amount;
        newPots.forEach(pot => {
            if (amountRemaining >= pot.highBet){
                pot.playerAmounts[i.id] = {amount: pot.highBet}
                amountRemaining = amountRemaining - pot.highBet;
            }
        })
        if (amountRemaining > 0){
            let playerId = i.id;
            newPots.push({
                id: newPots.length,
                highBet: amountRemaining,
                playerAmounts: {
                    [playerId] : {amount: amountRemaining}
                }
            })
        }
    })
    game.table.pots = newPots;
}

function maybeReturnExtraMoney(game){
    // A side pot has collapsed if there are 0 players who are not current with bet and still have chips and haven't folded.
    // That person gets all chips in the last pot
    let lastPot = game.table.pots[game.table.pots.length - 1];
    let lastPotBet = Utils.maxBetForPot(lastPot);
    let eligiblePlayerIds = [];
    game.players.forEach(p => {
        if (p.handState != "FOLD"){
            let playerBetInPot = Utils.playerBetForPot(lastPot, p);
            if (playerBetInPot < lastPotBet && p.chips > 0){
                eligiblePlayerIds.push(p.id);
            } else if (playerBetInPot == lastPotBet){
                // This would be the potential winner
                eligiblePlayerIds.push(p.id);
            }
        }
    })
   
    if (eligiblePlayerIds.length == 1){
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

function isSomeoneAllIn(game){
    let anyoneAlreadyAllIn = false;
    game.players.forEach(player => {
        if (player.handState == "ALLIN"){
            anyoneAlreadyAllIn = true;
        }
    })
    return anyoneAlreadyAllIn;
}

function maxCallableBet(game, playerToExclude){
    let max = 0;
    game.players.forEach(player => {
        if (player.id != playerToExclude.id){
            max = Math.max(max, player.chips + Utils.playerCurrentBet(game.table, player));
        }
    })
    return max;
}

function  actionBet(game, player, amount){
    /// **** THIS IS NOT AN ALL IN BET -> That is handled in another function ****
    let anyoneAlreadyAllIn = isSomeoneAllIn(game);
    let callAmount = Utils.getCallAmount(game.table, game.players, player);
    // this is essentially a raise action (range restricted to ensure this) but not an all-in
    // add logic here to not let the player 
    if (amount == player.chips){
        // should move this to be handled by the 'all-in' action for more clarity.
        throw new Error("Player attempted to go all in, but the received action was 'bet' ");
    }
    else if (amount == 0){
        // should move this to be handled by the 'check' action for more clarity.
        throw new Error("Player attempted to check, but the received action was 'bet' ");
    }
    else if (amount == callAmount){
        // should move this to be handled by the 'call' action for more clarity.
        throw new Error("Player attempted to check, but the received action was 'bet' ");
    }
    else if (amount < callAmount + game.table.minRaise ){
        // bet wasn't large enough
        throw new Error("Not a big enough raise. Min raise is " + game.table.minRaise + " over " + callAmount + " to call.");
    } else if (amount > maxCallableBet(game,player)){
        throw new Error("Bet is too big, no one can match it.");
    } else if (amount > player.chips){
        player.error = "You only have ", player.chips, " left."
    }
    else {
        // We now have a valid raise for sure!
        // If someone has already gone all-in on this pot already, we must:
        // 1. apply the call amount to the current pot
        // 2. create a new pot.
        // 3. bet the rest of the money in the new pot
        // Record that player has acted in street (used for later determination of when the street is over)
        player.actedInStreet = true;
        if (anyoneAlreadyAllIn){
            applyBet(game, game.table.activeIndex, callAmount);
            game.table.addPot();
            applyBet(game, game.table.activeIndex, amount - callAmount);
        } else {
            // Standard raise. Will not create side pot until it is called.
            applyBet(game, game.table.activeIndex, amount);
        }
        advanceGame(game);
    }
    return;
}

function actionCall(game, player){
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    applyBet(game, game.table.activeIndex, Utils.getCallAmount(game.table, game.players, player));
    advanceGame(game);
    return;
}

function actionCheck(game, player){
    // Essentially no change. Just move to next position
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    advanceGame(game);
    return;
}

function actionFold(game, player){
    // Change player state and advance to next position
    player.handState = "FOLD"
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;
    // If there are multiple pots, a fold could mean we have to give money back to a player and collapse a side pot
    if (game.table.pots.length > 1){
        maybeReturnExtraMoney(game);
    }
    advanceGame(game);
    return;
}

function actionAllIn(game, player){
    let anyoneAlreadyAllIn = isSomeoneAllIn(game);
    // call amount is sum of amounts needed to call each pot
    let callAmount = Utils.getCallAmount(game.table, game.players, player);
    
    // Record that player has acted in street (used for later determination of when the street is over)
    player.actedInStreet = true;

    // Player is all in. Any bet amount is legal here.
    
    let amount = player.chips;
    player.handState = "ALLIN";
    game.table.playerAllIn = player.playerId;
    console.log("call amouont is ", callAmount, ", all-in pushed in ", amount);

    // Now decide if we need to immediately create a side pot or not
    if (amount < callAmount){
        // siphon some funds off of the current pot and start a side pot
        console.log("Equalizing funds for new side pot since amount bet was ", amount, " and call amount was ", callAmount);
        applyBet(game, game.table.activeIndex, amount);
        equalizeFundsAndCreateSidePot(game);
    } else {
        // We have a raise.  Definitely have a side pot
        if (anyoneAlreadyAllIn){
            console.log(" --- someones already all in");
            applyBet(game, game.table.activeIndex, callAmount);
            if (amount - callAmount > 0 ){
                game.table.addPot();
            }
            applyBet(game, game.table.activeIndex, amount - callAmount);
        } else {
            console.log(" --- no one all in");
            // Standard all-in bet. Will not create side pot until it is called.
            applyBet(game, game.table.activeIndex, amount);
        }
    }
    advanceGame(game);
}

function advanceGame(game){
    // After a player takes some action, need to evaluate game state:
    // - game could be over (only 1 person is bettable or no one is bettable)
    // - hand could be over (someone just folded)
    // - hand needs to continue but betting is over? -> cover this through normal flow
    // - street could be over
    // - OR we just need to advance to the next player
    if (isGameComplete(game)){
        console.log("Game over!: ", game.status);
        game.status = 'complete';
    } else if (isHandComplete(game)){
        game.status = 'muck-check';
        console.log("Completed Hand: ", game.status);
        distributeWinnings(game);
        // muck-check
    } else if (Utils.isBettingComplete(game.table, game.players)){
        game.status = 'auto-advance';
        console.log("Betting complete");
        advanceStreet(game);
    } else if (Utils.isStreetComplete(game.table, game.players)){
        console.log("Completed street: ", game.table.street);
        advanceStreet(game);
    } else {
        // Move to next player (check earlier in function prevents players that are out from responding)
        console.log("Advancing to next player");
        game.table.activeIndex = Utils.nextValidPlayerIndex(game.players, game.table.activeIndex)
    }
}

function isGameComplete(game){
    // Game is complete if game status is between-hands AND
    // only 1 player is active and still has chips
    if (game.status == 'hand-complete'){
        let remainingPlayers = 0;
        game.players.forEach(function(player){
            if (player.gameState == 'ACTIVE' && player.chips > 0){
                remainingPlayers = remainingPlayers + 1;
            }
        })
        return (remainingPlayers <= 1);
    } else {
        return false;
    }
}

function isHandComplete(game){
    // Hand can be complete after a player action if:
    // - only 1 player in the last pot hasn't folded
    // - if all players are out of chips, we still let them advance through the
    // ---- game flow at their own pace, so we don't need to consider that 'handComplete'
    if (winByFolding(game) == true){
        console.log("Winner due to folding ");
        game.status = 'hand-complete';
        return true;
    } 
    else {
        return false;
    }
}

function winByFolding(game){
    // If there is only 1 pot, an outright win by folding
    // occurs if allPlayersHaveActed and only 1 hasn't folded.

    // If there are side pots:
    // Folding can only collapse the last pot, not provide an outright win 
    if (game.table.pots.length == 1){
        let playersLeft = 0;
        game.players.forEach(function(player){
            if (player.handState == "FOLD"){
                console.log("Player ", player.id, " is folded.");
            } else if (player.handState == "ALLIN"){
                console.log("Player ", player.id, " is all-in.");
                playersLeft = playersLeft + 1;
            }
            else {
                console.log("Player ", player.id, " is still active.");
                playersLeft = playersLeft + 1;
            }
        })
        return (playersLeft == 1);
    } else {
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
    if (typeof(game.table.activeIndex) == 'undefined'){
        // no action needs to occur, just keep showing results
        console.log("can freely advance");
        game.freeAdvance = true;
    } else {
        game.freeAdvance = false;
    }
    // Reset the minRaise
    game.table.minRaise = game.table.bigBlind;
    let ret = null;

    switch(game.table.street){
        case 'flop':
            ret = game.deck.take();
            game.deck = ret.deck;
            game.table.addBurnedCard(ret.card);
            for (let i = 0; i < 3; i++){
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
            distributeWinnings(game); // modifies the results array
            game.status = 'hand-complete';
            break;
        default:
            throw new Error("Invalid street could not be matched: ", game.table.street);
    }
}

function distributeWinnings(game){
    // cycle through pots since we may have to handle multiple pots
    // game.results is an array matching with pots
    game.table.pots.forEach(function(pot, index){
        let potResults = evalPot(game.table, pot, index, game.players);
        console.log("pot results are ", potResults);
        game.results.push(potResults);
    })
}

function evalPot(table, pot, potIndex, players){
    // for a single pot, find winner (or winners for a tie)
    // need to handle win by folding as well

    let potTotal = Utils.potTotal(pot);
    let resultsList = [];

    // Get list of Ids who could win the pot (i.e. they didn't fold and they contributed money to the pot)
    let playerIdsInPot = [];

    players.forEach(function(player){
        if (player.handState == "FOLD"){
            // player folded so they definitely can't win
        } else if (player.gameState == "ACTIVE" && Utils.playerInPot(pot, player)){
            // player is still in (i.e. hasn't left the table)
            playerIdsInPot.push(player.id);
        } else {
            // player didn't contribute to pot or player is not active (has left table/paused)
            // they can't win the pot.
        }
    })

    console.log("Potential winners of pot index ", potIndex, " are ", playerIdsInPot);

    // First check to see if there is only 1 potential winner for this pot (others have folded)
    if (playerIdsInPot.length == 1){
        // only 1 player can win, so we can get them directly
        let winningPlayer = Utils.getByAttributeValue(players,"id", playerIdsInPot[0]);
        winningPlayer.wins(potTotal);
        console.log("Winner by : ", winningPlayer.prettyName());
        resultsList.push({
            winner_name: winningPlayer.prettyName(),
            winning_hand: "maybe muck?",
            amount: potTotal
        })
    } else {
        // Need to evaluate who wins. Could still be multiple winners if there is a tie.
        // Need to round down final answer to next whole number in case of a 0.5 chip.
        let handsByPlayer = [];
        let solutions = [];
        playerIdsInPot.forEach(pId => {
            let player = Utils.getByAttributeValue(players,"id", pId);
            handsByPlayer.push({player: player, hand: player.hand.concat(table.commonCards)})
        })
        handsByPlayer.forEach(function(h, i){
            let solution = Solver.solve(h.hand);
            solution.index = i;
            solutions.push(solution);
        })

        let winningHands = Solver.winners(solutions);
        let winnersCount = winningHands.length;
        console.log("*** handsByPlayer are ", handsByPlayer);
        console.log("*** winningHands are ", winningHands);
        winningHands.forEach(function(winningHand){
            let winningPlayer = handsByPlayer[winningHand.index].player
            let winningAmount = potTotal/winnersCount;
            winningPlayer.wins(winningAmount);
            resultsList.push({
                winner_name: winningPlayer.prettyName(),
                winning_hand: winningHand.descr,
                amount: winningAmount
            })
            console.log("winner is ", winningPlayer.prettyName());
            console.log("with hand ", winningHand.descr);
            console.log("amount: ", winningAmount);
        })
    }
    return resultsList;
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
module.exports.nextStreet = nextStreet; // only exporting for Testing...I don't like this