
const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../../server');
const internals = {
    cookieRx: /(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/
};

describe('GET /', () => {

    let server;
    
    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('responds with 302 and redirects', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/joinGame',
            payload: {
                firstName: "Jeff",
                lastName: "Mason",
                gameCode: "abc"
            },
            });
        const header = res.headers['set-cookie'];
        expect(header.length).to.equal(1);
        cookie = header[0].match(internals.cookieRx);
        expect(cookie[0]).to.contain("sid-example=")
        expect(res.statusCode).to.equal(302);
        expect(res.headers.location).to.equal('/game/abc');
    })

    it('does not allow missing gamecode', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/joinGame',
            payload: {
                firstName: "Jeff",
                lastName: "Mason"
            },
            });
        expect(res.statusCode).to.equal(400);
        expect(res.result.message).to.contain('"gameCode" is required');
    })

})