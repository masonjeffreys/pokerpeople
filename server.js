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
    await server.register(require('@hapi/basic')); // use basic authentication. This creates a scheme.

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

    server.auth.strategy('simple', 'basic', { validate }); // Implementation of basic authentication. A strategy called 'simple'

    // server.auth.strategy('session', 'cookie', {
    //     name: 'sid-example',
    //     password: '!wsYhFA*C2U6nz=Bu^%A@^F#SF3&ksr6',
    //     isSecure: false
    // });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    });
    
    server.route({
        method: 'GET',
        path: '/',
        handler: (req, h) => {
            return h.view('home', {
                title: 'Poker Pig',
                message: 'Bring home the bacon for charity'
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/api/handleConn',
        handler: GameController.handleConn,
        options: {
            auth: 'simple', // Try using simple authentication here
            validate: {
                payload: Joi.object({
                    firstname: Joi.string().required(),
                    lastname: Joi.string().required()
                })
            }
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
        path: '/api/new',
        handler: GameController.start
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