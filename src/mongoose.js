const _ = require('@tabit/utils').moredash;
const logger = require('winston');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const chalk = require('chalk');
const debug = require('debug')('infra:db');

const ChildModels = require('./child_models');
const ChildModelDirectory = require('./child_model_directory');
const SchemaDescriptionBuilder = require('./schema_decriptor_builder');

const DEFAULT_POOL_SIZE = 20;

require('mongoose-schema-extend');

let createdModels = {};

class DB {
    constructor() {
        console.log('connecting to Mongo databases...');

        Promise.promisifyAll(mongoose);
        mongoose.Promise = Promise;
        mongoose.set('debug', (process.env.DEBUG_MONGOOSE && process.env.DEBUG_MONGOOSE !== 'false' && process.env.DEBUG_MONGOOSE !== '0') || false);
        mongoose.set('objectIdGetter', false);
        mongoose.set('useCreateIndex', true);

        this.plugins = {
            ttl: require('./plugins/ttl_plugin'),
            timestamp: require('mongoose-times'),
            hide: require('./plugins/hide_plugin'),
            deactivate: require('./plugins/deactivate_plugin'),
        };
    }

    get modelsMap() {
        return createdModels;
    }

    setupConnection(mongoUri, name = 'connection', options = {}) {
        let poolSize = process.env.POOL_SIZE
            ? parseInt(process.env.POOL_SIZE)
            : DEFAULT_POOL_SIZE;

        options = options || {
            server: { poolSize: poolSize, reconnectTries: Number.MAX_VALUE },
            replset: { poolSize: DEFAULT_POOL_SIZE }
        };

        let connection = mongoose.createConnection(mongoUri, options);
        this[name] = connection;
        let displayName = name ? name + ' ' : '';

        connection.on('error', function (error) {
            logger.error(chalk.bold.red(`Failed to connect to ${displayName}DB`, error));
        });

        connection.on('open', function () {
            logger.info(`Connected to ${displayName}DB at: ` + mongoUri);
        });

        connection.on('opening', function () {
            logger.info(`reconnecting to ${displayName}DB at: ${mongoUri}. Ready-state: ${connection.readyState}`);
        });

        connection.on('close', function () {
            logger.warn(chalk.bold.yellow(`Disconnected from ${displayName}DB: ` + mongoUri));
        });

        return connection;
    }

    /**
     * Create a mongoose model for the specified connection
     * @param connection - the mongoose connection on which to create the model
     * @param {String} modelName - The name of the model. It is the base for the table name.
     * @param {mongoose.Schema} modelSchema - The mongoose schema instance created to define the model.
     * @param {Object} [options] - Options to define automatically supported plugins.
     * @param {Boolean|Object} [options.timestamp] - Add date field for "created" and "lastUpdated",
     * that are set automatically according to their names.
     * @param {Boolean|Object} [options.ttl] - Add automatic "expiresAt" field, to include expiration time for the documents.
     */
    createModel(connection, modelName, modelSchema, options = {}) {
        debug(`creating model "${modelName}" on connection ${connection.name}`);

        _.forEach(this.plugins, (plugin, key) => {
            if (options[key])
                modelSchema.plugin(plugin, options[key]);
        });

        let model;
        if (options.inherit && options.inherit.from)
            model = options.inherit.from.discriminator(modelName, modelSchema, options.inherit.discriminator);
        else
            model = connection.model(modelName, modelSchema);

        // TODO: remove (mongoose methods are now awaitable)
        Promise.promisifyAll(model);
        Promise.promisifyAll(model.prototype);

        createdModels[modelName] = model;

        return model;
    }

    getChildModels(parentModel) {
        return new ChildModels(createdModels, parentModel).children;
    }

    createChildModelDirectory(parentModel, mapModelToKey) {
        return new ChildModelDirectory(this.getChildModels(parentModel), mapModelToKey)
    }

    getSchemaDescription(model, format, updateParamKeys) {
        let schemaDescription = format === 'tree'
            ? model.schema.tree
            : new SchemaDescriptionBuilder(model, updateParamKeys).build();

        schemaDescription._modelName = model.modelName;
        return schemaDescription;
    }

    use(key, plugin) {
        this.plugins[key] = plugin;
    }
}

module.exports = new DB();
