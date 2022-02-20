'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');
const Bcrypt = require('bcrypt');
const Socket = require("socket.io"); 
 
const exampleUsers = {
    john: {
        username: 'john',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret' after BCrypt
        name: 'John Doe',
        id: '2133d32a'
    }
};

const validate = async (request, username, password, h) => {
    //await console.log("Here!");
    console.log("username is: ", username);
    console.log("password is: ", password);
    const user = exampleUsers[username];
    if (username === 'help') {
        return { response: h.redirect('https://hapijs.com/help') };     // custom response
    }
    if (!user) {
        console.log("No user exists by username: ", username);
        return { credentials: null, isValid: false };
    }

    const isValid = await Bcrypt.compare(password, user.password);
    console.log("Is valid? ", isValid);
    const credentials = { id: user.id, name: user.name };

    return { isValid, credentials };
};

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



    await server.initialize();
    await server.register(Vision);
    await server.register(Inert);
    await server.register(require('@hapi/cookie')); // use for login/logout

    const io = Socket(server.listener)

    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('chat message', (msg) => {
            console.log("chat message received: ", msg);
            io.emit('chat message', msg);
        });
        socket.on('disconnect', () => {
          console.log('user disconnected');
        });
    });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates',
        layout: 'layout',
        layoutPath: 'templates'
    });

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'sid-example',
            password: '!wsYhFA*C2U6nz=Bu^%A@^F#SF3&kSR6',
            isSecure: false
        },
        redirectTo: '/unauthenticated',
        validateFunc: async (req, session) => {

            // const account = await users.find(
            //     (user) => (user.id === session.id)
            // );

            // if (!account) {

            //     return { valid: false };
            // }

            return { valid: true, credentials: {id: 1} };
        }
    });

    server.auth.default('session');
    
    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: false
        },
        handler: (req, h) => {
            return h.view('home', {
                title: 'Poker Pig',
                message: 'Bring home the bacon for charity'
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/joinGame',
        handler: GameController.joinGame,
        options: {
            auth: {
                mode: 'try'
            },
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                    gameId: Joi.string().required()
                })
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/game',
        options: {
            auth: false
        },
        handler: (req, h) => {
            return h.view('game', {
                title: 'Poker Pig',
                message: 'Bring home the bacon for charity'
            });
        }
    });
    
    server.route({
        method: 'POST',
        path: '/api/createPlayer',
        handler: GameController.createPlayer,
        options: {
            validate: {
                payload: Joi.object({
                    firstname: Joi.string().required(),
                    lastname: Joi.string().required()
                })
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/addPlayer',
        handler: GameController.addPlayer
    });
    
    server.route({
        method: 'GET',
        path: '/api/new',
        handler: GameController.new
    });

    server.route({
        method: 'GET',
        path: '/api/nextHand',
        handler: GameController.nextHand
    });
    
    server.route({
        method: 'GET',
        path: '/api/call',
        handler: GameController.call
    });
    
    server.route({
        method: 'GET',
        path: '/api/bet',
        handler: GameController.bet
    });
    
    server.route({
        method: 'GET',
        path: '/api/fold',
        handler: GameController.fold
    });
    
    server.route({
        method: 'GET',
        path: '/api/check',
        handler: GameController.check
    });

    server.route({
        // Route for getting random picture
        // using the directory handler requires Inert to be registered
        method: 'GET',
        path: '/{param*}',
        options: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'public'),
                listing: true
            }
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