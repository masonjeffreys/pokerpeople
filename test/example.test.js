// Example Test Formats to Follow

'use strict';

const Code = require('@hapi/code'); // Load Lab (test runner that is produced by Hapi people)
const Lab = require('@hapi/lab'); // Load Lab (test runner that is produced by Hapi people)


const { init } = require('../server'); // If the app is required, this is required to start the server
const { expect } = Code; // Use this instead of Assert
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script(); // Defines several constants that are useful for test followup, and notation

// Every test case should have at least one assertion

// Define test case. Params are
// 1 - description of test case
// 2 - callback function

// Basic unit test example
it('returns true when 1 + 1 equals 2', () => {
    expect(1 + 1).to.equal(2);
});

// Basic server page call test example
describe('GET /', () => {
    let server;
    
    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('responds with 200', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/'
        });
        expect(res.statusCode).to.equal(200);
    })
})