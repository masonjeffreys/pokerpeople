var Utils = require('../utils');
var Handlers = require('./handlers');

exports.plugin = {
    name: 'hapi-realtime',
    version: '1.0.0',
    register: async function (server, options, next) {
        let cookieName = options.cookieName; // The name of the cookie to look at
        let userString = options.userString; // the user string ('user')
        let userIdString = options.userIdString; // the userId ('id')

        module.server = server;
        module.options = options;

        var io = require('socket.io')(server.listener);
        

        io.on('connection', function (socket) {
            // Expose socket for use in Handlers
            module.socket = socket;
            
            socket.use(([event, ...args], next) => {
                // Socket middleware runs on every request.
                // do something with the packet (logging, authorization, rate limiting...)
                // do not forget to call next() at the end
                // let userId = state.states[cookieName][userString][userIdString];
                
                module.server.states.parse(socket.request.headers.cookie).then(function(state){
                    let userId = state.states[cookieName][userString][userIdString];
                    module.userId = userId;
                    console.log("*** Request from user id ", userId);
                    next();
                });

            });

            // As soon as someone joins, broadcast new game state to everyone
            // Everyone needs new state since we have a new player
            let gameCode = socket.handshake.query.gameCode;
            socket.join("game" + gameCode);
            socket.server.to("game" + gameCode).emit('new state', Handlers.getState());

            // Set up listeners for other room events
            // This will be player actions, player leaving, 
            socket.on('add player', Handlers.simulateAnotherPlayerJoining);
            socket.on('start game', Handlers.startGame);
            socket.on('new game', Handlers.newGame);
            socket.on('test mode', Handlers.toggleTestMode);
            socket.on('next hand', Handlers.nextHand);
            socket.on('check', Handlers.check);
            socket.on('call', Handlers.call);
            socket.on('all in', Handlers.allIn);
            socket.on('fold', Handlers.fold);
            socket.on('bet', Handlers.bet);
            socket.on('advance', Handlers.advance);
            socket.on('muck', Handlers.muckChoice);
            socket.on('buy back in', Handlers.buyBackIn);

            // Add chat functionality
            socket.on('newMessage', Handlers.newMessage);

            // Do something on leaving table?
            socket.on('goodbye', Handlers.goodbye);

            // Do something if socket disconnects
            socket.on("disconnecting", () => {
                console.log("Disconnecting event ", socket.rooms); // the Set contains at least the socket ID
            });
            socket.on("disconnect", (reason) => {
                console.log("Socket disconnect reason: ", reason);
            });
        });

        ///////
        // Middleware for initial authentication
        //
        // this function will be executed only once per connection
        // (even if the connection consists in multiple HTTP requests).
        // Thus is cannot be used to do authorization on every request
        // 
        //////

        io.use(function (socket, next) {
            
            server.states.parse(socket.request.headers.cookie).then(function(state){

                //if no user data and game id is set, connection will be refused
                if (!state.states[cookieName][userString]) {
                    console.log("No user data found! We do not proceed with ws connection.");
                    return next(new Error("Cookie not found"));
                }

                // we have a userId, so let's get the user
                // Then maybe we can add to server.auth?
                let userId = state.states[cookieName][userString][userIdString];
                let user = Utils.getByAttributeValue(server.app.users, "id", parseInt(userId));

                //if the userid is not set, we are not authenticated
                if (!user) {
                    console.log("Socket: User not found");
                    return next(new Error("Session is not authenticated. User not found."));
                }

                let gameCode = socket.handshake.query.gameCode;
                let game = Utils.getByAttributeValue(server.app.games, "gameCode", gameCode);

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

                console.log("Authorized websocket connection user ", userId, " to game ", gameCode);

                // Store socket ID with user for private events later
                // This does prevent a user from playing multiple games at once.
                user.socketId = socket.id;

                //everything is fine, session is authenticated and we accept the
                //connection

                // Can assign data to the socket like:
                console.log("***** Middleware: setting user data on socket to ", user.id);
                
                // Not sure how long this lives.
                // Would rather access server to modify data..
                
                next();
            })
        });
    }
}