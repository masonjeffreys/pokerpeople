function getByAttributeValue(array, attrName, attrValue){
    return array.filter(x => x[attrName] === attrValue)[0]
}

function isValidPlayer(player){
    // Player must be "IN" and have chips to play
    // Note that tricky rules apply when the player has less chips than the minBet.
    return (player.handState == "IN" && player.chips > 0);
}

function isNonFoldedPlayer(player){
    return (player.handState != "FOLD")
}

function playerCanBet(player){
    // To be eligible to bet, player must be valid
    // Note that tricky rules apply when the player has less chips than the minBet.
    if (player.allInPotNumber == null){
        if (isValidPlayer(player)){
            // player is not all in, not folded and still has chips. So they can bet.
            return true;
        } else {
            return false;
        }
    } else {
        // Player is all in
        return false;
    }
}



function correctIndex(arrayLen, givenIndex){
    // ensure that index is in array. If not, loop index back to beginning of array!
    let index;
    if (givenIndex > arrayLen - 1){
        index = 0; // start at beginning of array
    } else if (givenIndex < 0){
        index = 0;
    }
    else {
        index = givenIndex; // index is okay
    }
    return index;
}

function playerCurrentBet(table,player){
    let totals = [];
    table.pots.forEach( function(pot,index) {
        let playerBet = pot.playerAmounts[player.id];
        let playerBetAmount = 0;
        if (playerBet){
            playerBetAmount = playerBet.amount;
        }
        totals.push(playerBetAmount);
    })
    return totals;
}

function playerCurrentBetInt(table, player){
    const total = playerCurrentBet(table, player).reduce(add, 0); // with initial value to avoid when the array is empty
    function add(accumulator, a) {
        return accumulator + a;
    }
    return total;
}

function logState(game){
    console.log("Street is: ", game.table.street)
    console.log("Table showing: ", game.table.commonCards)
    console.log("Pot for all is ", mainPotTotal(game.table))
    game.players.forEach(function(player){
        console.log("Player ", player.id, " has: ", player.hand, " and current bet is: ", playerCurrentBet(game.table, player))
    })
    console.log("Current player index is: ", game.table.activeIndex)
}

function dealOne(players, deck, startIndex){
    // Cycles through each valid player beginning at startIndex
    let iteration = 0;
    let len = players.length;
    let index = correctIndex(len, startIndex);
    while (iteration < len){
        if (isValidPlayer(players[index])){
            players[index].addCard(deck.take());
        }
        index = correctIndex(len, index + 1);
        iteration = iteration + 1;
    }
    return players;
}

function potTotal(pot){
    var total = 0;
    let keys = Object.keys(pot.playerAmounts);
    keys.forEach(key => {
        total = total + pot.playerAmounts[key].amount;
    })
    return total;
}

function mainPotTotal(table){
    return potTotal(table.pots[0]);
}

function potTotals(table){
    let totals = [];
    table.pots.forEach(pot => {
        totals.push(potTotal(pot))
    })
    return totals;
}

function allPotsTotal(table){
    return potTotals(table).reduce((partialSum, a) => partialSum + a, 0);;
}

function potForPlayer(table, player){
    // Eventually include side pot logic
    // If player still has chips, they are a part of all pots
    var total = 0;
    if (player.chips > 0){
        total = allPotsTotal(table);
    }

    // Player is out of chips
    else {
        table.pots.forEach(pot => {
            // First determine if the player participated in the pot.        
            var participated = false;
            pot["bets"].forEach(bet => {
                if (bet.playerId == player.id){
                    participated = true;
                }
            })
            // If player participated, they can win that money
            if (participated == true) {
                pot["bets"].forEach(bet => {
                    total = total + bet.amount;
                })
            }
        })
    }
    
    return total;
}

function isStreetComplete(table, players){
    // add logic for whether street should be done
    // All players have had a chance to act (blinds don't count)
    // All players who haven't folded have bet the same amount of money for the round.
    // This will get more complicated with side pots
    // Street can also be complete if all players have 0 money left
    var currentMaxBet = 0;
    players.forEach(function(player){
        if (playerCurrentBetInt(table, player) > currentMaxBet){
            currentMaxBet = playerCurrentBetInt(table, player)
        }
    })
    console.log("currentMaxBet is ", currentMaxBet);
    var streetComplete = true;
    players.forEach(function(player){
        console.log("player ", player.id, " bet is ", playerCurrentBet(table, player));
        if (player.actedInStreet && playerCurrentBetInt(table, player) == currentMaxBet) {
            console.log(player.id, " is current with bet.")
        } else if (player.handState == "FOLD") {
            console.log(player.id, " has folded.")
        }
        else {
            console.log("Betting round not done. Player ", player.id, " needs to act.")
            streetComplete = false;
        }
    })
    return streetComplete;
}

function nonFoldedPlayersCount(players){
    sum = 0;
    players.forEach(function(player){
        if (isNonFoldedPlayer(player) == true){
            sum = sum + 1
        }
    })
    return sum;
}

function bettablePlayersCount(players){
    sum = 0;
    players.forEach(function(player){
        if (playerCanBet(player) == true){
            sum = sum + 1
        }
    })
    return sum;
}

function nextValidPlayer(players, prevIndex){
    // Uses index of another function to get the actual player
    return players[nextValidPlayerIndex(players, prevIndex)]
}

function nextValidPlayerIndex(players, prevIndex){
    // Valid means that they are active in the hand, haven't folded, and capable of meeting the minimum bet
    let i;
    let len = players.length;
    let index = correctIndex(len, prevIndex + 1); // makes sure the starting point is valid and loops if necessary

    while (i == null) {
        if ( isValidPlayer(players[index]) == true ){
            i = index;
        } else {
            index = correctIndex(len, index + 1)
        }
    }
    return i;
}

function playerMaxBet(table, players){
    var max = 0;
    players.forEach(player => {
        let pcb = playerCurrentBetInt(table, player);
        if (pcb > max){
            max = pcb;
        }
    })
    return max;
}

function getCallAmount(table, players, player){
    // sums over all pots for a given player
    let callAmount = 0;
    getCallAmounts(table, players, player).forEach(i => {
        callAmount = callAmount + i;
    })
    return callAmount;
}

function getCallAmounts(table, players, player){
    // needs to work for multiple pots
    let callAmounts = [];
    table.pots.forEach(function(pot,index){
        callAmounts.push(maxBetForPot(pot,players) - playerBetForPot(pot, player));
    })
    return callAmounts;
}

function playerBetForPot(pot, player){
    let playerBet = 0;
    let entry = pot.playerAmounts[player.id];
    if (entry){
        playerBet = entry.amount;
    }
    return entry;
}

function maxBetForPot(pot,players){
    let potMaxBet = 0;
    players.forEach(player => {
        let playerMax = playerBetForPot(pot, player);
        if (playerMax > potMaxBet){
            potMaxBet = playerMax;
        }
    })
    return potMaxBet;
}

function getOptions(players, player, table){
    var actionOpts = {fold: true, allIn: player.chips}; // can always fold or go all in
    var callAmounts = getCallAmounts(table, players, player);
    if (Math.max(callAmounts) == 0){
        actionOpts.check = true;
    } else if ( player.chips >= callAmounts[callAmounts.length - 1] ){
        // non-zero call amount
        // player can only call if they have enough chips
        // otherwise they will need to simply go all-in, not being able to call
        actionOpts.call = callAmounts[callAmounts.length - 1];
    } 
    
    actionOpts.bet = getBetRange(player.chips, callAmounts[callAmounts.length - 1], table.minRaise);
    
    return actionOpts;
}

function getBetRange(chips, callAmount, minRaise){
    if (chips > 0){
        if (chips < callAmount || chips < (callAmount + minRaise)){
            // player has chips, but not enough to call. Only option is to go all-in.
            return [chips, chips]
        } else if (chips < (callAmount + minRaise)){
            // player has chips enough to call, but not enough to raise. Min is call, max is all-in
            return  [callAmount, chips]
        } else {
            // player can raise, or go up to full amount of chips
            return [minRaise + callAmount, chips]
        }
    } else {
        return [];
    }
}

module.exports.bettablePlayersCount = bettablePlayersCount;
module.exports.correctIndex = correctIndex;
module.exports.nextValidPlayer = nextValidPlayer;
module.exports.nextValidPlayerIndex = nextValidPlayerIndex;
module.exports.dealOne = dealOne;
module.exports.potForPlayer = potForPlayer;
module.exports.mainPotTotal = mainPotTotal;
module.exports.potTotals = potTotals;
module.exports.getOptions = getOptions;
module.exports.logState = logState;
module.exports.nonFoldedPlayersCount = nonFoldedPlayersCount;
module.exports.isStreetComplete = isStreetComplete;
module.exports.getCallAmount = getCallAmount;
module.exports.getCallAmounts = getCallAmounts;
module.exports.playerMaxBet = playerMaxBet;
module.exports.playerCurrentBet = playerCurrentBet;
module.exports.getByAttributeValue = getByAttributeValue;
module.exports.isValidPlayer = isValidPlayer;
module.exports.getBetRange = getBetRange;
module.exports.playerCanBet = playerCanBet;
module.exports.potTotal = potTotal;
module.exports.playerCurrentBetInt = playerCurrentBetInt;