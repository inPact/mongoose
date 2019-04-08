const _ = require('lodash');

/**
 * Plugin to mark entity as inactive instead of removing it from the database.
 * Adds "active" field, and filter it out when it equals "false".
 * @param schema - apply the plugin to this schema.
 * @param excludedIndexes - array of index names to exclude the "active" field from.
 *    By default, the plugin adds "active" field to all indexes by default.
 * @param deactivateMethod - method that get the inactive document instance,
 *          and executes the action against the database.
 *   By default, the plugin save the document after setting the "active" flag to false.
 */
function plugin(schema, { excludedIndexes, deactivateMethod } = {}) {
    schema.add({ active: { type: Boolean, default: true } });
    schema.index({ active: -1 }, { sparse: true });

    // add to existing indexes
    excludedIndexes = excludedIndexes || [];
    schema._indexes.forEach(index => {
        if(!excludedIndexes.some(indxName => index[1].name === indxName))
            index[0] = _.extend({ active: -1 }, index[0])
    });

    // add key to later configured indexes
    let oldIndexMethod = schema.index;
    schema.index = function (fields, options) {
        let newFields = fields;
        if(!excludedIndexes.some(indxName => options.name === indxName))
            newFields = _.extend({ active: -1 }, fields);
        oldIndexMethod.call(this, newFields, options);
    };

    function filterByActive(next) {
        if (!this.options.getInactive && ![0, 1, true, false].some(x => x === this._conditions.active))
            this._conditions.active = { $ne: false };

        next();
    }

    schema.methods.deactivate = function () {
        this.active = false;
        if(deactivateMethod)
            return deactivateMethod(this);
        return this.saveAsync();
    };

    schema.methods.reactivate = function () {
        this.active = true;
        return this.saveAsync();
    };

    schema.pre('count', filterByActive);
    schema.pre('find', filterByActive);
    schema.pre('findOne', filterByActive);
}

module.exports = plugin;
