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

function isValidPlayer(player){
    return (player.handState == "IN");
}

function correctIndex(arrayLen, givenIndex){
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

function dealOne(players, deck, startIndex){
    // Cycles through each valid player beginning at startIndex
    let iteration = 0;
    let len = players.length;
    let index = correctIndex(len, startIndex);

    while (iteration <= len){
        if (isValidPlayer(players[index])){
            players[index].hand.push(deck.take());
            index = correctIndex(len, index + 1)
        }
        iteration = iteration + 1;
    }
}

function potForPlayer(players){
    var pot = 0;
    players.forEach(player => {
        pot = pot + player.bet;
    })
    return pot;
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
        console.log("Index is: ", index);
        if ( isValidPlayer(players[index]) == true ){
            i = index;
        } else {
            index = correctIndex(len, index + 1)
        }
    }
    return i;
}

function getCallAmount(table, player){
    return (table.currentBet - player.currentBet);
}

function getOptions(player, table, street){
    var actionOpts = [];
    var callAmount = getCallAmount(table, player);
    actionOpts.push(`Bet up to ${player.chips}`);
    if ( callAmount > 0 ){
        actionOpts.push(`${callAmount} to call`);
    }
    if (callAmount == 0){
        actionOpts.push(`Check`);
    }
    if (player.chips > 0){
        actionOpts.push(`All in with ${player.chips} more chips.`)
    }
    actionOpts.push(`Fold`)
    return actionOpts;
}

module.exports.getNextHandPlayerIndex = getNextHandPlayerIndex;
module.exports.getCurrentPlayerIndex = getCurrentPlayerIndex;
module.exports.nextValidPlayer = nextValidPlayer;
module.exports.nextValidPlayerIndex = nextValidPlayerIndex;
module.exports.dealOne = dealOne;
module.exports.potForPlayer = potForPlayer;
module.exports.getOptions = getOptions;