const Authenticator = require('./f_authentication')

function handleConn(conn, payload){
    // *Authentication
    // get/create user
    let data = {};
    data['user'] = Authenticator.findOrCreateUser(payload);
    // get/create game
    data['game'] = Authenticator.findOrCreateGame(payload);
    // advance game
    data['gamestate'] = advanceGameState(data['game'], payload);
    // end game
    conn['data'] = data;
    return conn
}

function advanceGameState(game, payload){
    console.log("Do somthing with game state!")
    let gameState;
    gameState = {lastAction: "Fold by player 2"}
    return gameState;
}

module.exports.handleConn = handleConn;