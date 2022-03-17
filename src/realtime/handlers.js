const Orchestrator = require('../orchestrator');
const Decorator = require('../decorator');
const Repo = require('../repo');

function emitPrivateStateToEachPlayer(game){
    game.players.forEach(function(player){
        let state = Decorator.privateState(game,player);
        module.parent.socket.server.to(player.socketId).emit('private', state);
    })
}

function getPlayer(game){
    let desiredPlayerId = game.players[game.table.activeIndex].id;
    let player;
    if (game.testMode){
        // In test mode, each action happens for the appropriate player. No validation
        player = game.players.find(p => p.id == desiredPlayerId)
        return player;
    } else {
        // Pull player from connection information and make sure it matches the activeIndex on the table.
        player = game.players.find(p => p.id == parseInt(module.parent.socket.data.userId));
        if (player.id == desiredPlayerId){
            return player;
        } else {
            let errString = "Player " + player.id + " tried to act. But it was player " + desiredPlayerId + " turn."
            throw new Error(errString);
        }
    }
}

exports.hello = function () {
    this.emit('Hi back at you');
};

exports.newMessage = function (newMessage) {
    console.log('Got message', newMessage);
};

exports.startGame = () => {
    // Only called after players have sat at table.
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.startGame(game);
    emitPrivateStateToEachPlayer(game);
}

exports.startTestGame = () => {
    // Only called after players have sat at table.
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    game["testMode"] = true;
    emitPrivateStateToEachPlayer(game);
}

exports.getState = () => {
    // 'this' refers to a socket (and emit for a room will not send back to the original requester)
    // 'this'.server refers to a server (and emit for a room will send back to all people)
    // socket.id gives a unique id. Could also use this to send a private message.

    // exposed module.server and module.socket on parent for use here.
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    emitPrivateStateToEachPlayer(game);
};

exports.simulateAnotherPlayerJoining = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    let player = Repo.getOrCreateUser({firstName: "User", lastName: module.parent.server.app.users.length + 1}, module.parent.server.app.users)
    Orchestrator.addPlayerToGame(game, player);
    emitPrivateStateToEachPlayer(game);
};

exports.nextHand = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.nextHand(game);
    emitPrivateStateToEachPlayer(game);
}

exports.bet = (msg) => {
    if (msg && msg.amount && typeof(parseInt(msg.amount)) == "number"){
        let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
        Orchestrator.receiveAction(game, 'bet', parseInt(msg.amount))
        emitPrivateStateToEachPlayer(game);
    }
    else {
        console.log("Invalid bet. Msg was: ", msg);
    }
};

exports.allIn = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'all in')
    emitPrivateStateToEachPlayer(game);
};

exports.call = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    let player = getPlayer(game);
    Orchestrator.callAction(game, player);
    emitPrivateStateToEachPlayer(game);
};

exports.check = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'check')
    emitPrivateStateToEachPlayer(game);
};

exports.fold = () => {
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.receiveAction(game, 'fold')
    emitPrivateStateToEachPlayer(game);
};

exports.advance = () =>{
    let game = Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
    Orchestrator.advanceGame(game);
    emitPrivateStateToEachPlayer(game);
}

exports.goodbye = function () {

    this.emit('Take it easy, pal');
};