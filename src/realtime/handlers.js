const Utils = require('../utils');

exports.hello = function () {

    this.emit('Hi back at you');
};


exports.newMessage = function (newMessage) {

    console.log('Got message', newMessage);
};

exports.getState = () => {
    // 'this' refers to a socket (and emit for a room will not send back to the original requester)
    // 'this'.server refers to a server (and emit for a room will send back to all people)
    // socket.id gives a unique id. Could also use this to send a private message.

    // exposed module.server and module.socket on parent for use here.
    let game = Utils.getByAttributeValue(module.parent.server.app.games, "id", parseInt(module.parent.socket.handshake.query.gameId));
    var playersInfo = [];
    game.players.forEach(function(player){
      playersInfo.push({
          playerId: player.id,
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
    return {playersInfo: playersInfo};
};

exports.newPlayer = () => {
    // 'this' refers to a socket (and emit for a room will not send back to the original requester)
    // 'this'.server refers to a server (and emit for a room will send back to all people)
    // socket.id gives a unique id. Could also use this to send a private message.

    // exposed module.server and module.socket on parent for use here.


    let game = Utils.getByAttributeValue(module.parent.server.app.games, "id", parseInt(module.parent.socket.handshake.query.gameId));
    var playersInfo = [];
    game.players.forEach(function(player){
      playersInfo.push({
          playerId: player.id,
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
    module.parent.socket.server.in("game" + module.parent.socket.handshake.query.gameId).emit('player added', {playersInfo: playersInfo});
};


exports.goodbye = function () {

    this.emit('Take it easy, pal');
};