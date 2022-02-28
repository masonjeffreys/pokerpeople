'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');
const AuthController = require('./src/controllers/auth');
const RealTime = require('./src/realtime');

exports.init = async function () {

    const server = Hapi.server({
        port: 8080,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            },
            validate: {
                failAction: async (request, h, err) => {
                    // During development, log and respond with the full error.
                    console.error(err);
                    throw err;
                }
            }
        }
    });

    let context = {
        title: 'Poker Pig',
        message: 'Bring home the bacon for charity',
    };

    // Until we have a DB, we will store games and players here in memory
    // get the right game/user, update state, and store again.
    server.app.players = [];
    server.app.games = [];

    await server.initialize();
    await server.register(Vision);
    await server.register(Inert);
    await server.register(require('@hapi/cookie')); // use for login/logout
    await server.register({
        plugin: RealTime,
        options: {
            cookieName: 'sid-example',
            userString: 'user',
            userIdString: 'id'
        }
    });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates',
        layout: 'layout',
        layoutPath: 'templates',
        context
    });

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'sid-example',
            password: '!wsYhFA*C2U6nz=Bu^%A@^F#SF3&kSR6',
            isSecure: false
        },
        redirectTo: '/',
        // Subsequent requests containing the session cookie are authenticated 
        // and validated via the provided validateFunc in case the cookie's
        // encrypted content requires validation on each request.

        // This doesn't set the cookie, just allows the route to proceed or not, reads the existing
        // session information, and sets that information as credentials on the request

        // Function is only called if session information exists
        validateFunc: AuthController.validate
    });

    server.auth.default('session');

    server.route({
        method: 'GET',
        path: '/unauthenticated',
        options: {
            auth: false
        },
        handler: AuthController.invalid
    });
    
    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: {
                mode: 'try' // We'll use the validateFunc to set user info if session/cookie data exists
            }
        },
        handler: AuthController.fillFormHomePage
    });

    server.route({
        method: 'POST',
        path: '/joinGame',
        handler: GameController.joinGame,
        options: {
            // for auth here, we will 'try' and then create a new user if one doesn't exist
            auth: {
                mode: 'try'
            },
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                    gameCode: Joi.string().required()
                }),
                options: {
                    allowUnknown: true
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/game/{gameCode}',
        handler: GameController.viewGame
    });


    /// Old routes before websockets handled everything
    //////

    // server.route({
    //     method: 'GET',
    //     path: '/api/{gameId}/nextHand',
    //     handler: GameController.nextHand
    // });
    
    // server.route({
    //     method: 'GET',
    //     path: '/api/{gameId}/call',
    //     handler: GameController.call
    // });
    
    // server.route({
    //     method: 'GET',
    //     path: '/api/{gameId}/bet',
    //     handler: GameController.bet
    // });
    
    // server.route({
    //     method: 'GET',
    //     path: '/api/{gameId}/fold',
    //     handler: GameController.fold
    // });
    
    // server.route({
    //     method: 'GET',
    //     path: '/api/{gameId}/check',
    //     handler: GameController.check
    // });

    ///////////////
    // Begin routes for static files and error handling
    ///////////////

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/img/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/img'),
                listing: true
            }
        }
    });

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/css/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/css'),
                listing: true
            }
        }
    });

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/js/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public/js'),
                listing: true
            }
        }
    });

    server.route({
        method: '*',
        path: '/{any*}',
        options: {
            auth: false
        },
        handler: function (request, h) {
            return '404 Error! Page Not Found!';
        }
    });

    return server;
};

exports.start = async function (server) {
    await server.start();
    console.log('Server running on %s', server.info.uri);
    return server;
}


// Error Handling
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});