'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Vision = require('@hapi/vision');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    await server.register(Vision);

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    });

    server.route({
        method: 'GET',
        path: '/index',
        handler: (req, h) => {
            return h.view('index', {
                title: 'Using handlebars in Hapi',
                message: 'Tutorial'
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {

            return 'Hello World!';
        }
    });

    server.route({
        method: 'GET',
        path: '/api/new',
        handler: (request, h) => {
            return 'new game'
        }
    });

    server.route({
        method: 'GET',
        path: '/api/call',
        handler: (request, h) => {
            return 'calling bet'
        }
    });

    server.route({
        method: 'GET',
        path: '/api/bet',
        handler: (request, h) => {
            return `betting ${request.query.amount}`
        }
    });

    server.route({
        method: 'GET',
        path: '/api/fold',
        handler: (request, h) => {
            return 'folding'
        }
    });

    server.route({
        method: 'GET',
        path: '/api/check',
        handler: (request, h) => {
            return 'check'
        }
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