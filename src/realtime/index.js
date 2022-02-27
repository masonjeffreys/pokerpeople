var Utils = require('../utils');
var Handlers = require('./handlers');

exports.plugin = {
    name: 'hapi-realtime',
    version: '1.0.0',
    register: async function (server, options, next) {
        let cookieName = options.cookieName;
        let userString = options.userString;
        let userIdString = options.userIdString;

        module.server = server;

        var io = require('socket.io')(server.listener);
        

        io.on('connection', function (socket) {
            // Expose socket for use in Handlers
            module.socket = socket;

            // As soon as someone joins, broadcast new game state to everyone
            // Everyone needs new state since we have a new player
            let gameId = socket.handshake.query.gameId;
            socket.join("game" + gameId);
            socket.server.to("game" + gameId).emit('new state', Handlers.getState());

            // Set up listeners for other room events
            // This will be player actions, player leaving, 
            socket.on('add player', Handlers.getState);
            socket.on('newMessage', Handlers.newMessage);
            socket.on('goodbye', Handlers.goodbye);

            socket.on("disconnect", (reason) => {
                console.log("Socket disconnect reason: ", reason);
            });
        });

        ///////
        // Middleware for authentication
        // Executed on every websocket request and ping.
        //////

        io.use(function (socket, next) {
            
            server.states.parse(socket.request.headers.cookie).then(function(state){

                //if no user data and game id is set, connection will be refused
                if (!state.states[cookieName][userString]) {
                    console.log("No user data found! We do not proceed with ws connection.");
                    return next(new Error("Cookie not found"));
                }

                if (!state.states[cookieName][userString]) {
                    console.log("No user data found! We do not proceed with ws connection.");
                    return next(new Error("Cookie not found"));
                }

                // we have a userId, so let's get the user
                // Then maybe we can add to server.auth?
                let userId = state.states[cookieName][userString][userIdString];
                let user = Utils.getByAttributeValue(server.app.players, "id", parseInt(userId));

                //if the userid is not set, we are not authenticated
                if (!user) {
                    console.log("Socket: User not found");
                    return next(new Error("Session is not authenticated. User not found."));
                }

                let gameId = socket.handshake.query.gameId;
                let game = Utils.getByAttributeValue(server.app.games, "id", parseInt(gameId));

                //if the game is not found, we are not authenticated
                if (!game) {
                    console.log("Socket: Game not found");
                    return next(new Error("Session is not authenticated. Game not found."));
                }

                let userInGame = game.players.find(
                    (player) => (player.id === parseInt(userId))
                );

                //if user exists but isn't in the game specified, we refuse
                if (!userInGame) {
                    console.log("Socket: User is not in game.");
                    return next(new Error("Session is not authenticated. User not authorized for game."));
                }
                console.log("Authorized websocket connection user ", userId, " to game ", gameId);
                //everything is fine, session is authenticated and we accept the
                //connection

                // Can assign data to the socket like:
                // socket.data = {user: user, game: game};
                // Not sure how long this lives.
                // Would rather access server to modify data..
                
                next();
            })
        });
    }
}