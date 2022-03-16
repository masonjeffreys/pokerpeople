function getByAttributeValue(array, attrName, attrValue){
    return array.filter(x => x[attrName] === attrValue)[0]
}

function isValidPlayer(player){
    // Player must be "IN" and have chips to play
    // Note that tricky rules apply when the player has less chips than the minBet.
    return (player.handState == "IN" && player.chips > 0);
}

function playerInPot(pot, player){
    let playerAmount = pot.playerAmounts[player.id];
    if(playerAmount && playerAmount.amount > 0){
        return true;
    } else {
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
    })

    return streetComplete;
}

function nextValidPlayerIndex(players, prevIndex){
    // Valid means that they are active in the hand, haven't folded, and capable of meeting the minimum bet
    let i;
    let len = players.length;
    let index = correctIndex(len, prevIndex + 1); // makes sure the starting point is valid and loops if necessary

    // there may not be a next valid player! I.e. betting is done but we need to just advance the cards
    let counter = 0;
    while (i == null) {
        if ( isValidPlayer(players[index]) == true ){
            i = index;
        } else {
            index = correctIndex(len, index + 1)
        }
        counter = counter + 1;
        if (counter > len * 2){
            return null;
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

// Export functions. Go alphabetical to prevent duplication
module.exports.correctIndex = correctIndex;
module.exports.dealOne = dealOne;
module.exports.getOptions = getOptions;
module.exports.getCallAmount = getCallAmount;
module.exports.getCallAmounts = getCallAmounts;
module.exports.getByAttributeValue = getByAttributeValue;
module.exports.isStreetComplete = isStreetComplete;
module.exports.maxBetForPot = maxBetForPot;
module.exports.nextValidPlayerIndex = nextValidPlayerIndex;
module.exports.playerBetForPot = playerBetForPot;
module.exports.playerCurrentBet = playerCurrentBet;
module.exports.playerCurrentBetInt = playerCurrentBetInt;
module.exports.playerInPot = playerInPot;
module.exports.playerMaxBet = playerMaxBet;
module.exports.potTotal = potTotal;