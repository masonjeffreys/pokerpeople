'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');
const Bcrypt = require('bcrypt');

const exampleUsers = {
    john: {
        username: 'john',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'John Doe',
        id: '2133d32a'
    }
};

const validate = async (request, username, password) => {

    const user = exampleUsers[username];
    if (!user) {
        return { credentials: null, isValid: false };
    }

    const isValid = await Bcrypt.compare(password, user.password);
    const credentials = { id: user.id, name: user.name };

    return { isValid, credentials };
};

// server.route({
//     method: 'GET',
//     path: '/account/{username}',
//     handler: (request, h) => {
//         var accountMock = {};
//         if (request.params.username == "jeff"){
//             accountMock = {
//                 username: "jeff",
//                 password: "1234",
//                 website: "https://jeffmason.me"
//             }
//         }
//         return accountMock;
//     }
// });

// server.route({
//     method: "POST",
//     path: "/account",
//     options: {
//         validate: {
//             payload: Joi.object({
//                 firstname: Joi.string().required(),
//                 lastname: Joi.string().required(),
//                 timestamp: Joi.any().forbidden().default((new Date).getTime())
//             })
//         }
//     },
//     handler: (request, h) => {
//         return request.payload
//     }
// });

exports.init = async function () {

    const server = Hapi.server({
        port: 3000,
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
    await server.register(require('@hapi/basic')); // use basic authentication

    server.auth.strategy('simple', 'basic', { validate }); // call the auth method 'simple'

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