// Example Test Formats to Follow

'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)

const { init } = require('../server'); // If the app is required, this is required to start the server
const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it, beforeAll } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

// Every test case should have at least one assertion

// Define test case. Params are
// 1 - description of test case
// 2 - callback function

// Basic unit test example
// it('returns true when 1 + 1 equals 2', () => {
//     expect(1 + 1).to.equal(2);
// });


// Lab uses Shot under the covers to inject a call into the HTTP chain
// Shot returns an response object with the following properties:

// statusCode - the HTTP status code.
// headers - an object containing the headers set.
// payload - the response payload string.
// rawPayload - the raw response payload buffer.
// raw - an object with the injection request and response objects:
// req - the simulated node request object.
// res - the simulated node response object.
// result - the raw handler response (e.g. when not a stream or a view) before it is serialized for transmission. If not available, the value is set to payload. Useful for inspection and reuse of the internal objects returned (instead of parsing the response string).
// request - the request object.

// Player API calls
describe('Player API Calls', () => {

    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('can create player', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/api/createPlayer',
            payload: {
                firstname: "Jeff",
                lastname: "Mason"
            }
        })
        expect(res.statusCode).to.equal(200);
        expect(res.result.data.playerId).to.equal(1);
    });

});

// Gameplay API calls
describe('Gameplay API Calls. A player can: ', () => {

    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('can start a new game', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/api/new'
        })
        expect(res.statusCode).to.equal(200);
    });

    it('can call a bet', async() => {
        const res = await server.inject({
            method: 'get',
            url: '/api/call'
        })
        expect(res.statusCode).to.equal(200);
    });

    it('can bet an amount', async() => {
        const res = await server.inject({
            method: 'get',
            url: '/api/bet'
        })
        expect(res.statusCode).to.equal(200);        
    });

    it('can fold', async() => {
        const res = await server.inject({
            method: 'get',
            url: '/api/fold'
        })
        expect(res.statusCode).to.equal(200);   
    });

    it('can check', async() => {
        const res = await server.inject({
            method: 'get',
            url: '/api/check'
        })
        expect(res.statusCode).to.equal(200);    
    });

    it('can execute functional call', async () => {
        const res = await server.inject({
            method: 'post',
            url: '/api/handleConn',
            headers: { 'Authorization': 'Basic am9objpzZWNyZXQ=' },
            payload: {
                firstname: "Jeff",
                lastname: "Mason"
            }
        })
        expect(res.statusCode).to.equal(200);
        expect(res.result.data).to.equal(1);
    });
});