'use strict';
console.log("Beginning Poker Pig");

const { start, init } = require('./server.js');

function startAppAndServer(){
    init(start());
}

startAppAndServer();