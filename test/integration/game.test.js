
const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../../server');
const internals = {
    cookieRx: /(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/
};

describe('GET /', () => {

    let server;
    let cookie;
    let cookie2;
    
    beforeEach(async () => {
        server = await init();
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
        
    });

    afterEach(async () => {
        await server.stop();
    });

    it('responds with 200', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/game/abc',
            headers: { cookie: 'sid-example=' + cookie[1] }
        });
        console.log(res);
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.contain('Start Game');
    })

    it('allows adding another player', async () => {
        // Second player signs on
        const res2 = await server.inject({
            method: 'POST',
            url: '/joinGame',
            payload: {
                firstName: "Small",
                lastName: "Blind",
                gameCode: "abc"
            },
        });
        const header2 = res2.headers['set-cookie'];
        expect(header2.length).to.equal(1);
        cookie2 = header2[0].match(internals.cookieRx);

        const res = await server.inject({
            method: 'get',
            url: '/game/abc',
            headers: { cookie: 'sid-example=' + cookie2[1] }
        });
        console.log(res.result);
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.contain('Small');
    })

})