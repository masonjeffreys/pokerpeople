var Handlers = require('./handlers');
var Utils = require('../utils');


exports.plugin = {
    name: 'hapi-realtime',
    version: '1.0.0',
    register: async function (server, options, next) {
        let cookieName = options.cookieName;
        let userString = options.userString;
        let userIdString = options.userIdString;

        var io = require('socket.io')(server.listener);

        io.on('connection', function (socket) {
            console.log('New connection!');
            socket.on('add player', Handlers.getState);
            socket.on('newMessage', Handlers.newMessage);
            socket.on('goodbye', Handlers.goodbye);
        });

        

        io.use(function (socket, next) {
            // Define middleware. Executed on every websocket request and ping
            console.log("in middleware");
            
            server.states.parse(socket.request.headers.cookie).then(function(state){

                console.log("Session user id is: ", state.states[cookieName][userString]);
                console.log("Server app state is: ", server.app)

                //if no session is set, connection will be refused
                if (!state.states[cookieName][userString]) {
                    console.log("No session found! We do not proceed with ws connection.");
                    return next(new Error("Cookie not found"));
                }

                // we have a userId, so let's get the user
                // Then maybe we can add to server.auth?
                let userId = state.states[cookieName][userString][userIdString];

                let user = Utils.getByAttributeValue(server.app.players, "id", parseInt(userId));

                //if the userid is not set, we are not authenticated
                if (!user) {
                    console.log("user doesn't exist in websockets");
                    return next(new Error("Session is not authenticated. User not found."));
                }

                //everything is fine, session is authenticated and we accept the
                //connection
                next();
            })
        });
    }
}