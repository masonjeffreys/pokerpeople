function handleConn(conn, payload){
    let user = {firstname: "Jeff", lastname: "Mason", userId: 1};
    let game = {gameId: 1, players: [], state:{}};

    // *Authentication
    // get/create user
    conn['user'] = user;
    // get/create game
    conn['game'] = game;
    // advance game
    // end game
    return conn
}

module.exports.handleConn = handleConn;