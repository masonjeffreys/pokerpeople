////////////////////////
// Utilities that use no objects. Just regular data.
// Would like to grow this file over time. These are very reusable.
////////////////////////

function getByAttributeValue(array, attrName, attrValue){
    return array.filter(x => x[attrName] === attrValue)[0]
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

////////////////////////
///////// Utilities that DO use objects/references specific keys
///////// These may be generalizable with some work
//////////////////////

function isValidPlayer(player){
    // Player must have game state = "ACTIVE"
    // Player must have hand state = "IN" (i.e. not "FOLD" or "ALLIN")
    // Player must have chips to play
    // Not sure how player could be "IN" AND not have chips left, so this third check may be redundant

    // This will return a player with chips even if he/she is the only one with chips left.
    // In this case, the player should just be able to check or the game should auto-advance.
    return (player.gameState == "ACTIVE" && player.handState == "IN" && player.chips > 0);
}

function playerInPot(pot, player){
    let playerAmount = pot.playerAmounts[player.id];
    if( playerAmount && playerAmount.amount > 0 ){
        return true;
    } else {
        return false;
    }
}

function playerCurrentBet(table,player){
    let totals = [];
    table.pots.forEach( function(pot) {
        let prevBet = pot.playerAmounts[player.id];
        let playerBetAmount = 0;
        if (prevBet){
            playerBetAmount = prevBet.amount;
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

function dealOne(players, deck, startIndex){
    // Cycles through each valid player beginning at startIndex
    let iteration = 0;
    let len = players.length;
    let index = correctIndex(len, startIndex);
    while (iteration < len){
        if (isValidPlayer(players[index])){
            let card = deck.cards.shift();
            players[index].addCard(card);
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

function isBettingComplete(table, players){ // boolean
    return nextValidPlayerIndex(players, table.activeIndex) == null;
}

function isStreetComplete(table, players){
    // Assume side pots are set before this function is called.
    // Returns true if no more betting can occur, otherwise, false.

    // Example if side pots exist (someone is all in):
    // If player went all in and didn't meet minRaise, betting is not opened. Just have to call/fold
    // If player went all in and met minRaise, players afterward have to meet 


    // Logic for single pot:
    // All players have had a chance to act (blinds don't count)
    // All players who haven't folded have bet the same amount of money for the round.
    // Street can also be complete if all players have 0 money left

    // Player doesn't have to be current with bet if they are all in.

    var currentMaxBet = 0;
    players.forEach(function(player){
        if (playerCurrentBetInt(table, player) > currentMaxBet){
            currentMaxBet = playerCurrentBetInt(table, player)
        }
    })

    console.log("currentMaxBet is ", currentMaxBet);
    var streetComplete = true;

    players.forEach(function(player){
        if (player.gameState == "ACTIVE"){
            console.log("player ", player.id, " bet is ", playerCurrentBet(table, player));
            if (player.actedInStreet && playerCurrentBetInt(table, player) == currentMaxBet) {
                console.log(player.id, " is current with bet.")
            } else if (player.handState == "FOLD") {
                console.log(player.id, " has folded.")
            } else if (player.handState == "ALLIN"){
                console.log(player.id, " is all in.")
            } else {
                console.log("Betting round not done. Player ", player.id, " needs to act.")
                streetComplete = false;
            }
        }
    })

    return streetComplete;
}

function nextValidPlayerIndex(players, prevIndex){ // int/null;
    // Valid means that they are active in the game, haven't folded, and have some chips left.
    let nextIndex = null;
    let len = players.length;
    let index = correctIndex(len, prevIndex + 1); // makes sure the starting point is valid and loops if necessary

    // there may not be a next valid player! I.e. betting is done but we need to just advance the cards.
    // in this case return null;

    // Max attempts at finding an active player should be equal to number of players.
    // i counts the attempts while index loops the actual query
    for (let i = 0; i < len; i++) {
        if ( isValidPlayer(players[index]) == true ){
            nextIndex = index;
        } else {
            index = correctIndex(len, index + 1)
        }
    }
    return nextIndex;
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
    let callAmounts = [];
    table.pots.forEach(function(pot,index){
        callAmounts.push(maxBetForPot(pot) - playerBetForPot(pot, player));
    })
    return callAmounts;
}

function playerBetForPot(pot, player){
    let playerBet = 0;
    let entry = pot.playerAmounts[player.id];
    if (entry){
        playerBet = entry.amount;
    }
    return playerBet;
}

function maxBetForPot(pot){
    let potMaxBet = 0;
    let keys = Object.keys(pot.playerAmounts);
    keys.forEach(key => {
        let playerBet = pot.playerAmounts[key].amount;
        if (playerBet > potMaxBet){
            potMaxBet = playerBet;
        }
    })
    return potMaxBet;
}

function getOptions(gameStatus, players, player, table){
    // Only call this function for players that the game requests an action from.
    // So we really shouldn't have to check for 'FOLD' state or 'ALLIN' state.
    let actionOpts = {};

    if (gameStatus == 'muck-check'){
        actionOpts.muck = true; // only action is to respond to muck request
    } else {
        let callAmounts = getCallAmounts(table, players, player);
        let callAmount = callAmounts[callAmounts.length - 1];
        let upperLimit = Math.min(maxMatchByOtherPlayers(table, players, player) + callAmount, player.chips);
        if (canFold(player)){
            // Is player allowed to fold?
            actionOpts.fold = true;
        }
        if (canCheckOrCall(player)){
            // Player is allowed to check or call. Never can do both.
            // Need this function because there are times where a call is allowed by not a raise!
            // If player doesn't have enough chips to call, we'll have to disable this.

            // Is there a situation where a player can't call? If they are all in already.

            if (callAmount == 0) {
                actionOpts.check = true;
            } else if (upperLimit >= callAmount) {
                // call amount here would be 69. upper limit would be 
                actionOpts.call = callAmount;
            } else {
                // Player is allowed to call, but can't do it because they don't have enough chips.
            }
        }
        if (canRaise(players, player, table)){
            // "can raise" here means that they are allowed to do something other than call (raise or go all in)
            // In other words, betting is not 'capped'
            // we will factor in the player chips amount in the range determination.
            // - the player has chips left
    
            // Get full range that is allowed, factoring in the amount of chips the player has
            let betRange = getBetRange(players, player, table, callAmounts);

            // Based on the range, set options.
            if (betRange != []){
                actionOpts.bet = betRange;
                if (actionOpts.bet[1] == player.chips){
                    // if bet range max is equal to player chips, they can go all in.
                    actionOpts.allIn = player.chips;
                }
            }
        }
    }
    return actionOpts;
}

function canCheckOrCall(player){
    // Player is allowed to at least try to check or call if they are active
    // If outstanding callAmount is > 0, player can try to call!
    if (player.handState !== "FOLD" && player.handState !== "ALLIN"){
        return true;
    } else {
        return false;
    }
}

function canFold(player){
    // can always fold if they are still active in hand
    if (player.handState !== "FOLD"){
        return true;
    } else {
        return false;
    }
}

function canRaise(players, playerOfInterest, table){
    // Determine if, just based on game rules, playerOfInterest is allowed to raise (irredgardless of if they have chips)
    // Player is allowed if:
    // - the amounts in the active hand are not equal
    // - the player is not already leading the betting round
    // We will worry about the actual range later.

    // Player doesn't have to be current with bet if they are all in.
    let currentMaxBet = 0;

    players.forEach(function(player){
        if (playerCurrentBetInt(table, player) > currentMaxBet){
            currentMaxBet = playerCurrentBetInt(table, player)
        }
    })

    if (playerCurrentBetInt(table, playerOfInterest) == currentMaxBet && playerOfInterest.actedInStreet == true){
        // Player has acted and is already the bet leader. Can't raise yourself
        return false;
    } else {
        var raiseAllowed = false;

        players.forEach(function(player){
            console.log("player ", player.id, " bet is ", playerCurrentBet(table, player));
            if (player.actedInStreet && playerCurrentBetInt(table, player) == currentMaxBet) {
                console.log(player.id, " is current with bet.")
            } else if (player.handState == "FOLD") {
                console.log(player.id, " has folded.")
            } else if (player.handState == "ALLIN"){
                console.log(player.id, " is all in.")
            } else {
                console.log("Betting round not done. Player ", player.id, " needs to act.")
                raiseAllowed = true;
            }
        })
        return raiseAllowed;
    }
}

function maxMatchByOtherPlayers(table, players, playerToExclude){
    // The point of this function is to not let a player bet more than someone else at the table can match.
    // Eg. the chip leader can't actually go all-in. They would only be able to put in as many chips
    // as the next biggest stack could match.

    let maxPossibleMatch = 0;
    // Cycle through each player other than the playerToExclude
    // If player is still in, we need to theoretically make a 'call' and then see how many chips
    // they have left to match a possible raise.
    players.forEach(player => {
        if (player.id != playerToExclude.id && player.handState == "IN"){
            let callAmount = getCallAmounts(table, players, player);
            let possibleRaise = player.chips - callAmount;
            if (possibleRaise > maxPossibleMatch){
                maxPossibleMatch = possibleRaise;
            }
        }
    })
    return maxPossibleMatch;
}

function getBetRange(players, playerOfInterest, table, callAmounts){
    // If we are calling this function, player is legally allowed to raise.
    // Need to determine what the possible bet range is, considering existing pots and player chips.
    // determine if another player can match or exceed this bet.
    let callAmount = callAmounts[callAmounts.length - 1];
    let maxPossibleMatch = maxMatchByOtherPlayers(table, players, playerOfInterest);
    console.log("Max raise by another player is: ", maxPossibleMatch);

    //set upper range to minimum of total chips or maxPossibleMatch
    let upperLimit = Math.min(playerOfInterest.chips, maxPossibleMatch + callAmount);

    if (upperLimit > 0){
        // Player has chips and some bet can be matched. Proceed.
        if (upperLimit < (callAmount + table.minRaise)){
            // playerOfInterest doesn't have enough chips to raise. Calling is handled separately.
            // Only 'raise'/bet is UpperLimit
            return  [upperLimit, upperLimit]
        } else {
            // playerOfInterest can raise from the minimum up to their UpperLimit
            return [callAmount + table.minRaise, upperLimit]
        }
    } else {
        // If player is already all in.
        return [];
    }
}

// Export functions. Go alphabetical to prevent duplication
module.exports.correctIndex = correctIndex;
module.exports.dealOne = dealOne;
module.exports.getOptions = getOptions;
module.exports.getCallAmount = getCallAmount;
module.exports.getCallAmounts = getCallAmounts;
module.exports.getByAttributeValue = getByAttributeValue;
module.exports.isBettingComplete = isBettingComplete;
module.exports.isStreetComplete = isStreetComplete;
module.exports.maxBetForPot = maxBetForPot;
module.exports.nextValidPlayerIndex = nextValidPlayerIndex;
module.exports.playerBetForPot = playerBetForPot;
module.exports.playerCurrentBet = playerCurrentBet;
module.exports.playerCurrentBetInt = playerCurrentBetInt;
module.exports.playerInPot = playerInPot;
module.exports.playerMaxBet = playerMaxBet;
module.exports.potTotal = potTotal;