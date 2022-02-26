'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');
const Bcrypt = require('bcrypt');
const Socket = require("socket.io");

// const validate = async (request, username, password, h) => {
//     //await console.log("Here!");
//     console.log("username is: ", username);
//     console.log("password is: ", password);
//     const user = exampleUsers[username];
//     if (username === 'help') {
//         return { response: h.redirect('https://hapijs.com/help') };     // custom response
//     }
//     if (!user) {
//         console.log("No user exists by username: ", username);
//         return { credentials: null, isValid: false };
//     }

//     const isValid = await Bcrypt.compare(password, user.password);
//     console.log("Is valid? ", isValid);
//     const credentials = { id: user.id, name: user.name };

//     return { isValid, credentials };
// };

exports.init = async function () {

    const server = Hapi.server({
        port: 8080,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    });

    const context = {
        title: 'Poker Pig',
        message: 'Bring home the bacon for charity'
    };

    await server.initialize();
    await server.register(Vision);
    await server.register(Inert);
    await server.register(require('@hapi/cookie')); // use for login/logout
    await server.register(require('./src/realtime'));

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
        validateFunc: GameController.validate
    });

    server.auth.default('session');

    server.route({
        method: 'GET',
        path: '/unauthenticated',
        options: {
            auth: false
        },
        handler: (req, h) => {
            return 'Cannot access this without logging in!<br><a href="/">Home</a>';
        }
    });
    
    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: {
                mode: 'try' // We'll use the validateFunc to set user info if session/cookie data exists
            }
        },
        handler: (req, h) => {
            console.log("Credentials are: ", req.auth.credentials);
            let user = {}
            if (req.auth.credentials && req.auth.credentials.user){
                user = req.auth.credentials.user;
            }
            return h.view('home', {
                user: user
            });
        }
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
            // validate: {
            //     payload: Joi.object({
            //         firstName: Joi.string().required(),
            //         lastName: Joi.string().required(),
            //         gameId: Joi.string().required()
            //     })
            // }
        }
    });

    server.route({
        method: 'GET',
        path: '/game/{gameId}',
        handler: GameController.viewGame
    });

    server.route({
        method: 'GET',
        path: '/api/{gameId}/currentState',
        handler: GameController.currentState
    });

    server.route({
        method: 'GET',
        path: '/api/{gameId}/addPlayer',
        handler: GameController.addPlayer
    });

    server.route({
        method: 'GET',
        path: '/api/{gameId}/nextHand',
        handler: GameController.nextHand
    });
    
    server.route({
        method: 'GET',
        path: '/api/{gameId}/call',
        handler: GameController.call
    });
    
    server.route({
        method: 'GET',
        path: '/api/{gameId}/bet',
        handler: GameController.bet
    });
    
    server.route({
        method: 'GET',
        path: '/api/{gameId}/fold',
        handler: GameController.fold
    });
    
    server.route({
        method: 'GET',
        path: '/api/{gameId}/check',
        handler: GameController.check
    });

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