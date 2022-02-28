const Orchestrator = require('../orchestrator');
const Decorator = require('../decorator');
const Repo = require('../repo');

function emitStateToRoom(game){
    let state = Decorator.gameState(game);
    module.parent.socket.server.in("game" + game.gameCode).emit('new state', state);
}

function emitPrivateStateToEachPlayer(game){
    game.players.forEach(function(player){
        let state = Decorator.privateState(game,player);
        module.parent.socket.server.to(player.socketId).emit('private', state);
    })
}

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
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    return Decorator.gameState(game);
};

exports.simulateAnotherPlayerJoining = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    let player = Repo.getOrCreateUser({firstName: "syx", lastName: "afdsn"}, module.parent.server.app.players)
    Orchestrator.addPlayerToGame(game, player);
    emitStateToRoom(game);
};

exports.nextHand = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.nextHand(game);
    emitStateToRoom(game);
    emitPrivateStateToEachPlayer(game);
}

exports.bet = (msg) => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'bet', parseInt(msg))
    emitStateToRoom(game);
};

exports.call = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'call')
    emitStateToRoom(game);
};

exports.check = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'check')
    emitStateToRoom(game);
};

exports.fold = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'fold')
    emitStateToRoom(game);
};

exports.goodbye = function () {

    this.emit('Take it easy, pal');
};