const _ = require('lodash');
const ms = require('ms');

// default TTL is 24 hours
const defaultTtlMs = 1000 * 60 * 60 * 24;

function plugin(schema, options) {
    let defaultTtl = (options && options.defaultTtl) || defaultTtlMs;
    let ttlMs = (typeof(defaultTtl) === 'number') ? defaultTtl : ms(defaultTtl);
    schema.add({
        expiresAt: {
            type: Date,
            default: function () {
                if (options.neverExpiresByDefault)
                    return null;
                else
                    return new Date(new Date().valueOf() + ttlMs);
            }
        }
    });
    schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    /**
     * Set the expiration period for this document
     * @param expiration: in milliseconds
     */
    schema.methods.expireIn = function (expiration) {
        this.expiresAt = toExpirationDate(expiration);
    };

    schema.methods.neverExpires = function () {
        this.expiresAt = undefined;
    };
}

function toExpirationDate(expiration) {
    if (typeof(expiration) === 'number')
        return new Date(new Date().valueOf() + expiration);

    let expirationMs = ms(expiration);
    return new Date(new Date().valueOf() + expirationMs);
}

module.exports = exports = plugin;
