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

function setHandPlayers(players, chipMin){
    var handPlayers = [];
    players.forEach(function(player, index) {
        if (player.gameState == 'ACTIVE' && player.chips >= chipMin){
            player.handState = 'IN';
            handPlayers.push(player)
        } else {
            player.handState = 'OUT';
        }
    });
    return handPlayers;
}

module.exports.getNextHandPlayerIndex = getNextHandPlayerIndex;
module.exports.getCurrentPlayerIndex = getCurrentPlayerIndex;
module.exports.setHandPlayers = setHandPlayers;