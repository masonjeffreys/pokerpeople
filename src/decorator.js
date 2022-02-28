const Utils = require('./utils');

function gameState(game){
    // Remind all players of current hand table state
    var playersInfo = [];
    
    game.players.forEach(function(player){
        playersInfo.push({playerId: player.id,
            chips: player.chips,
            name: player.prettyName(),
            actedInStreet: player.actedInStreet,
            button: player.button,
            smallBlind:  player.smallBlind,
            bigBlind: player.bigBlind,
            gameState: player.gameState,
            handState: player.handState
        })
    })
    
    return {
        game: {
            status: game.status,
            testMode: game.testMode,
            gameCode: game.gameCode
        },
        table: {
            id: game.table.id,
            street: game.table.street,
            highBet: Utils.playerMaxBet(game.table, game.players),
            commonCards: game.table.commonCards,
            pots: Utils.potTotals(game.table),
            activeIndex: game.table.activeIndex
        },
        playersInfo: playersInfo
    };
}

function privateState(game, player){
    // Send player cards to them indvidually
    // Also send actions to that player

    // gamePlayer is the player inside the game that contains the hand
    let gamePlayer = Utils.getByAttributeValue(game.players, "id", parseInt(player.id));
    let activeIndex = game.table.activeIndex;
    let actionOpts = [];

    if (activeIndex !== 'undefined' && activeIndex != null){
        if ( game.players[activeIndex].id == player.id ){
            actionOpts = Utils.getOptions(game.players, player, game.table);
        }
    }
    
    return {
        player: {
            id: gamePlayer.id,
            hand: gamePlayer.hand
        },
        actionOpts: actionOpts
    }
}

module.exports.gameState = gameState;
module.exports.privateState = privateState;