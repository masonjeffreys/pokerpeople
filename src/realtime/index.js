var Handlers = require('./handlers');

exports.plugin = {
    name: 'hapi-realtime',
    version: '1.0.0',
    register: async function (server, options, next) {

        var io = require('socket.io')(server.listener);

        io.on('connection', function (socket) {
            console.log('New connection!');
            socket.on('hello', Handlers.hello);
            socket.on('newMessage', Handlers.newMessage);
            socket.on('goodbye', Handlers.goodbye);
        });
    }
}