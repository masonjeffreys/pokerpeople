'use strict';
console.log("Beginning Poker Pig");

const { init, start } = require('./server.js');

async function startAppAndServer(){
    let server = await init();
    await start(server);
}

startAppAndServer();