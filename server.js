'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');

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