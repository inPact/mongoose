const utils = require('../');
const should = require('chai').should();

describe('module: ', function () {
    it('require should work', async function () {
        let { DB } = require('../');
        should.exist(DB.setupConnection);
    });
});
