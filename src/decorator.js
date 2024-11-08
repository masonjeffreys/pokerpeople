const Utils = require('./utils');

function privateState(game, player, showHandsForPlayers=[]){
    // Send player cards to them indvidually
    // Also send actions to that player

    let activeIndex = game.table.activeIndex;
    let actionOpts = [];
    // Remind all players of current hand table state
    let playersInfo = [];
    
    game.players.forEach(function(p){
        let hand = [];
        if (showHandsForPlayers.includes(p.id) || game.testMode ||  p.id == player.id || p.publicHand == true){
            // could show hand if players are all in or game is in test mode
            hand = p.hand;
        }
        playersInfo.push({playerId: p.id,
            chips: p.chips,
            firstName: p.firstName,
            lastName: p.lastName,
            actedInStreet: p.actedInStreet,
            button: p.button,
            smallBlind:  p.smallBlind,
            bigBlind: p.bigBlind,
            gameState: p.gameState,
            handState: p.handState,
            hand: hand,
            lastAction: p.lastAction
        })
    })

    if (activeIndex !== 'undefined' && activeIndex != null){
        if (game.testMode){
            // always send options in test mode (so that 1 machine can play for all)
            actionOpts = Utils.getOptions(game.status, game.players, game.players[activeIndex], game.table);
        }
        else if ( game.players[activeIndex].id == player.id ){
            // This is the active player. Add in options for actions they can take
            actionOpts = Utils.getOptions(game.status, game.players, player, game.table);
        }
    }
    
    return {
        playerId: player.id,
        game: {
            status: game.status,
            testMode: game.testMode,
            gameCode: game.gameCode,
            freeAdvance: game.freeAdvance,
            errors: game.errors
        },
        table: {
            id: game.table.id,
            street: game.table.street,
            highBet: Utils.playerMaxBet(game.table, game.players),
            startingChips: game.table.startingChips,
            minRaise: game.table.minRaise,
            commonCards: game.table.commonCards,
            pots: game.table.pots,
            activeIndex: game.table.activeIndex
        },
        playersInfo: playersInfo,
        actionOpts: actionOpts,
        results: game.results,
        lastAction: game.lastAction,
        callAmount: game.callAmount
    }
}

module.exports.privateState = privateState;