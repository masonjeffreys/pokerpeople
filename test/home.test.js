
const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../server');

describe('GET /', () => {
    
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

    it('responds with background pic', async () => {
        const res = await server.inject({
            method: 'get',
            url: '/'
        });
        console.log(res);
        expect(res.statusCode).to.equal(200);
    })
})