function getNextHandPlayerIndex(previousTablePosition, handPlayers){
    var i = handPlayers.findIndex(obj => obj.tablePosition >= previousTablePosition + 1 && obj.handState == 'IN');
    if (i == -1){
        return 0;
    } else {
        return i;
    }
}

function isValidPlayer(player){
    return (player.handState == "IN");
}

function correctIndex(arrayLen, givenIndex){
    // ensure that index is in array. If not, loop!
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

function showState(players, table){
    console.log("Table showing: ", table.commonCards)
    console.log("Pot for all is ", potForAll(players))
    players.forEach(function(player){
        console.log("Player ", player.id, " has: ", player.hand, " and current bet is: ", player.bet)
    })
    console.log("Current player index is: ", table.activeIndex)
}

function dealOne(players, deck, startIndex){
    // Cycles through each valid player beginning at startIndex
    let iteration = 0;
    let len = players.length;
    let index = correctIndex(len, startIndex);
    while (iteration < len){
        if (isValidPlayer(players[index])){
            players[index].hand.push(deck.take());
        }
        index = correctIndex(len, index + 1);
        iteration = iteration + 1;
    }
    return players;
}

function potForAll(players){
    // Eventually include side pot logic
    var pot = 0;
    players.forEach(player => {
        pot = pot + player.bet;
    })
    return pot;
}

function potForPlayer(players, player){
    // Eventually include side pot logic
    var pot = 0;
    players.forEach(player => {
        pot = pot + player.bet;
    })
    return pot;
}

function streetComplete(){
    // add logic for whether street should be done
    return true;
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

function playerMaxBet(players){
    var max = 0;
    players.forEach(player => {
        if (player.bet > max){
            max = player.bet;
        }
    })
    return max;
}

function getCallAmount(players, player){
    return (playerMaxBet(players) - player.bet);
}

function getOptions(players, player, table, street){
    var actionOpts = [];
    var callAmount = getCallAmount(players, player);
    
    if ( callAmount > 0 ){
        actionOpts.push(`${callAmount} to call`);
    }
    if (callAmount == 0){
        actionOpts.push(`Check`);
    }
    actionOpts.push(`Bet up to ${player.chips}`);
    if (player.chips > 0){
        actionOpts.push(`All in with ${player.chips} more chips.`)
    }
    actionOpts.push(`Fold`)
    return actionOpts;
}

module.exports.getNextHandPlayerIndex = getNextHandPlayerIndex;
module.exports.correctIndex = correctIndex;
module.exports.nextValidPlayer = nextValidPlayer;
module.exports.nextValidPlayerIndex = nextValidPlayerIndex;
module.exports.dealOne = dealOne;
module.exports.potForPlayer = potForPlayer;
module.exports.potForAll = potForAll;
module.exports.getOptions = getOptions;
module.exports.showState = showState;
module.exports.streetComplete = streetComplete;