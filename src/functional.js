function handleConn(conn, payload){
    // *Authentication
    // get/create user
    conn['user'] = findOrCreateUser(payload);
    // get/create game
    conn['game'] = findOrCreateGame(payload);
    // advance game
    // end game
    return conn
}

function findOrCreateUser(payload){
    let user;
    if (payload && 'userId' in payload){
        // get user from Database
        user = {firstname: "Database call", lastname: "goes here", userId: payload.userId}
    } else {
        user = {firstname: "Jeff", lastname: "Mason", userId: 1};
    }
    return user;
}

function findOrCreateGame(payload){
    let game;
    if (payload && 'gameId' in payload){
        // get user from Database
        game = {gameId: 0, players: [], state:{}};
    } else {
        game = {gameId: 1, players: [], state:{}};
    }
    return game;
}

module.exports.handleConn = handleConn;