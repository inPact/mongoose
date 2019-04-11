const _ = require('lodash');
const moment = require('moment');
const should = require('chai').should();
const { Schema } = require('mongoose');

describe('ttl-plugin via DB-wrapper should: ', function () {
    it('set expiration from string', async function () {
        let ASchema = new Schema({ name: String });
        let { DB } = require('../');
        let connection = DB.setupConnection('mongodb://localhost:27017/test', 'test');
        let model = DB.createModel(connection, 'A', ASchema, { ttl: '5m' });
        verifyFiveMinuteExpiration(model);
    });

    it('set expiration from number', async function () {
        let ASchema = new Schema({ name: String });
        let { DB } = require('../');
        let connection = DB.setupConnection('mongodb://localhost:27017/test', 'test');
        let model = DB.createModel(connection, 'A', ASchema, { ttl: 5000 * 60 });
        verifyFiveMinuteExpiration(model);
    });

    it('set expiration from object', async function () {
        let ASchema = new Schema({ name: String });
        let { DB } = require('../');
        let connection = DB.setupConnection('mongodb://localhost:27017/test', 'test');
        let model = DB.createModel(connection, 'A', ASchema, { ttl: { defaultTtl: '5 minutes' } });
        verifyFiveMinuteExpiration(model);
    });
});

function verifyFiveMinuteExpiration(model) {
    let expiresAt = _.get(model, 'schema.paths.expiresAt');
    should.exist(expiresAt);
    let defaultExpiration = moment(expiresAt.defaultValue());
    should.exist(defaultExpiration);
    defaultExpiration.isAfter(moment().add(4.9, 'minutes')).should.equal(true, defaultExpiration.format());
    defaultExpiration.isBefore(moment().add(5.1, 'minutes')).should.equal(true, defaultExpiration.format());
}