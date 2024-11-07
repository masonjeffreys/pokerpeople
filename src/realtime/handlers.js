const Orchestrator = require('../orchestrator');
const Decorator = require('../decorator');
const Repo = require('../repo');

function getGame(){
    return Repo.getGame(module.parent.socket.handshake.query.gameCode, module.parent.server.app.games);
}

function getPlayer(game, checkForCorrectPlayer = true){
    let idToAuth = module.parent.userId;
    let player;

    if (game.table.activeIndex != null) {
        // If table requires a certain player to act, ensure that we have this player
        // Pull player from connection information and make sure it matches the activeIndex on the table.
        let desiredPlayerId = game.players[game.table.activeIndex].id; // 1
        player = game.players.find(p => p.id == parseInt(idToAuth));
        if (game.testMode){
            player = game.players.find(p => p.id == desiredPlayerId);
        } else if (checkForCorrectPlayer) {
            if (player.id == desiredPlayerId){
                // Good!
            } else {
                let errString = "Player " + player.id + " tried to act. But it was player " + desiredPlayerId + " turn."
                console.log(errString);
                game.errors.push(errString);
            }
        }
    } else {
        // Table doesn't require a specific player, so we return the player that took the action
        // Applies for things like 'advancing' the round
        player = game.players.find(p => p.id == parseInt(idToAuth));
    }
    return player;
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
    let player = getPlayer(game);
    Orchestrator.startGame(game);
    game.lastAction = player.prettyName() + " clicked Start. Begin!";
    emitPrivateStateToEachPlayer(game);
}

exports.newGame = () => {
    // Only called after a previous game is complete
    console.log("new game");
    let game = getGame();
    let player = getPlayer(game);
    Orchestrator.startGame(game);
    console.log(game);
    game.lastAction = player.prettyName() + " started New Game. Begin!";
    emitPrivateStateToEachPlayer(game);
}

exports.buyBackIn = () => {
    console.log("buying back in");
    let game = getGame();
    let player = getPlayer(game);
    Orchestrator.buyBackIn(game, player);
    game.lastAction = player.prettyName() + " bought in again.";
    emitPrivateStateToEachPlayer(game);
}

exports.toggleTestMode = () => {
    // Only called after players have sat at table.
    let game = getGame();
    let player = getPlayer(game, false);
    if (game["testMode"]){
        game["testMode"] = false;
    } else {
        game["testMode"] = true;
    }
    game.lastAction = player.prettyName() + " toggled test mode.";
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
    game.lastAction = player.prettyName() + " added a player.";
    Orchestrator.addPlayerToGame(game, player);
    emitPrivateStateToEachPlayer(game);
};

exports.nextHand = () => {
    let game = getGame();
    let player = getPlayer(game);
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
            game.lastAction = player.prettyName() + " bet " + msg.amount + ".";
            Orchestrator.actionBet(game, player, parseInt(msg.amount))
        }
        emitPrivateStateToEachPlayer(game);
    }
    else {
        console.log("Invalid bet. Msg provided was: ", msg);
    }
};

exports.muckChoice = (msg) => {
    if (msg && typeof(msg.muck) == "boolean"){
        let game = getGame();
        let player = getPlayer(game); // only one player is allowed to muck, by definition.
        if (game.errors.length == 0){
            if (msg.muck) {
                game.lastAction = player.prettyName() + " chose not to show their cards";
            } else {
                game.lastAction = player.prettyName() + " revealed their cards";
            }
            Orchestrator.actionMuck(game, player, msg.muck);
        }
        emitPrivateStateToEachPlayer(game);
    } else {
        console.log("Invalid selection for mucking. Msg provided was: ", msg);
    }
}

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
    let player = getPlayer(game);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " folds.";
        Orchestrator.actionFold(game, player);
    }
    emitPrivateStateToEachPlayer(game);
};

exports.advance = () =>{
    let game = getGame();
    let player = getPlayer(game, false);
    if (game.errors.length == 0){
        game.lastAction = player.prettyName() + " advanced game."
        Orchestrator.advanceGame(game);
    }
    emitPrivateStateToEachPlayer(game);
}

exports.goodbye = function () {

    this.emit('Take it easy, pal');
};