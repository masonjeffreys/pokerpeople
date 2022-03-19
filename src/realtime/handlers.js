const Orchestrator = require('../orchestrator');
const Decorator = require('../decorator');
const Repo = require('../repo');

function getGame(){
    return Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
}

function getPlayer(game){
    let desiredPlayerId = game.players[game.table.activeIndex].id; // 1
    let idToAuth = module.parent.userId;
    let player;

    if (!game.testMode){
        // In test mode, each action happens for the appropriate player. No validation
        player = game.players.find(p => p.id == desiredPlayerId)
        return player;
    } else {
        // Pull player from connection information and make sure it matches the activeIndex on the table.
        player = game.players.find(p => p.id == parseInt(idToAuth));
        if (player.id == desiredPlayerId){
            return player;
        } else {
            console.log("id to authorize is ", idToAuth);
            console.log("game table active index is ", game.table.activeIndex);
            console.log("players are: ", JSON.stringify(game.players));
            let errString = "Player " + player.id + " tried to act. But it was player " + desiredPlayerId + " turn."
            console.log(errString);
            game.errors.push(errString);
        }
    }
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

exports.startGame = () => {
    // Only called after players have sat at table.
    let game = getGame();
    Orchestrator.startGame(game);
    emitPrivateStateToEachPlayer(game);
}

exports.startTestGame = () => {
    // Only called after players have sat at table.
    let game = getGame();
    game["testMode"] = true;
    emitPrivateStateToEachPlayer(game);
}

exports.getState = () => {
    // 'this' refers to a socket (and emit for a room will not send back to the original requester)
    // 'this'.server refers to a server (and emit for a room will send back to all people)
    // socket.id gives a unique id. Could also use this to send a private message.

    // exposed module.server and module.socket on parent for use here.
    let game = getGame();
    emitPrivateStateToEachPlayer(game);
};

exports.simulateAnotherPlayerJoining = () => {
    let game = getGame();
    let player = Repo.getOrCreateUser({firstName: "User", lastName: module.parent.server.app.users.length + 1}, module.parent.server.app.users)
    Orchestrator.addPlayerToGame(game, player);
    emitPrivateStateToEachPlayer(game);
};

exports.nextHand = () => {
    let game = getGame();
    let player = getPlayer(game, player);
    game.lastAction = player.prettyName() + " requested a new deal.";
    Orchestrator.nextHand(game);
    emitPrivateStateToEachPlayer(game);
}

exports.bet = (msg) => {
    // Validate 'data-level' stuff in handlers
    // (like making sure we have an integer, the correct player, a game that exists, etc)
    // Validate 'business-logic' in the orchestrator. I.e. bet is too high, too low, etc.
    // Think of business logic as anything that depends on the game state.
    // Not sure how to send business-logic errors back to user.
    if (msg && msg.amount && typeof(parseInt(msg.amount)) == "number"){
        let game = getGame();
        let player = getPlayer(game);
        // Store the last action on the game state for display
        if (game.errors.length == 0){
            game.lastAction = player.prettyName() + " bet " + amount;
            Orchestrator.actionBet(game, player, parseInt(msg.amount))
        }
        emitPrivateStateToEachPlayer(game);
    }
    else {
        console.log("Invalid bet. Msg was: ", msg);
    }
};

exports.allIn = () => {
    let game = getGame();
    let player = getPlayer(game);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " all in. Adding " + player.chips;
        Orchestrator.actionAllIn(game, player);
    }
    emitPrivateStateToEachPlayer(game);
};

exports.call = () => {
    let game = getGame();
    let player = getPlayer(game);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " calls."
        Orchestrator.actionCall(game, player);
    }
    emitPrivateStateToEachPlayer(game);
};

exports.check = () => {
    let game = getGame();
    let player = getPlayer(game);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " checks.";
        Orchestrator.actionCheck(game, player);
    }
    emitPrivateStateToEachPlayer(game);
};

exports.fold = () => {
    let game = getGame();
    let player = getPlayer(game, player);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " folds.";
        Orchestrator.actionFold(game);
    }
    emitPrivateStateToEachPlayer(game);
};

exports.advance = () =>{
    let game = getGame();
    let player = getPlayer(game, player);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " advanced game."
        Orchestrator.advanceGame(game);
    }
    emitPrivateStateToEachPlayer(game);
}

exports.goodbye = function () {

    this.emit('Take it easy, pal');
};