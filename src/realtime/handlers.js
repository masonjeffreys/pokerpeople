const Utils = require('../utils');
const Orchestrator = require('../orchestrator');
const GameController = require('../controllers/game');
const AuthController = require('../controllers/auth');


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

    let game = Utils.getByAttributeValue(module.parent.server.app.games, "gameCode", module.parent.socket.handshake.query.gameCode);
    return Orchestrator.gameState(game);
};

exports.simulateAnotherPlayerJoining = () => {
    let game = Utils.getByAttributeValue(module.parent.server.app.games, "gameCode", parseInt(module.parent.socket.handshake.query.gameCode));
    let player = AuthController.getOrCreateUser({firstName: "syx", lastName: "afdsn"}, module.parent.server.app.players)
    Orchestrator.addPlayerToGame(game, player);

    let state = Orchestrator.gameState(game);
    module.parent.socket.server.in("game" + module.parent.socket.handshake.query.gameId).emit('new state', state);
};


exports.goodbye = function () {

    this.emit('Take it easy, pal');
};