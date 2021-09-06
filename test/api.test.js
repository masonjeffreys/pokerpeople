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

// Basic API calls
describe('POST /api/addPlayer', () => {

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
})

// Old example of user creation
// Lab.test("creating valid user", function(done) {
//     var options = {
//         method: "PUT",
//         url: "/users/testuser",
//         payload: {
//             full_name: "Test User",
//             age: 19,
//             image: "dhown783hhdwinx.png"
//         }
//     };
 
    // server.inject(options, function(response) {
    //     var result = response.result,
    //     payload = options.payload;
 
    //     Lab.expect(response.statusCode).to.equal(200);   Lab.expect(result.full_name).to.equal(payload.full_name);
    //     Lab.expect(result.age).to.equal(payload.age);
    //     Lab.expect(result.image).to.equal(payload.image);
    //     Lab.expect(result.count).to.equal(0);
 
    //     done();
    // });
// });