'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const GameController =  require('./src/controllers/game');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    });

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
        method: 'GET',
        path: '/api/new',
        handler: GameController.start
    });

    server.route({
        method: 'GET',
        path: '/api/call',
        handler: (request, h) => {
            return {status: "success", data: 'calling bet'}
        }
    });

    server.route({
        method: 'GET',
        path: '/api/bet',
        handler: (request, h) => {
            return {status: "success", data: `betting ${request.query.amount}`}
        }
    });

    server.route({
        method: 'GET',
        path: '/api/fold',
        handler: (request, h) => {
            return {status: "success", data: 'folding'}
        }
    });

    server.route({
        method: 'GET',
        path: '/api/check',
        handler: (request, h) => {
            return {status: "success", data: 'check'}
        }
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {                                     // [3]
            directory: {                                 // [3]
                path: Path.join(__dirname, 'public'),      // [3]
                listing: true                              // [3]
            }
        }                                          // [3]                                           // [3]
    });

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

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();