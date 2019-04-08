const mongoose = require('mongoose');
const mongooseUtils = require('mongoose/lib/utils');

class ChildModelDirectory {

    /**
     * Create an instance of child model directory, built out of the list
     * of models that inherit from one base model
     * @param {Array<Model>} childModels - list of child models
     * @param {function} mapModelToKey - map the name of the model to the key used to extract it later.
     */
    constructor(childModels, mapModelToKey){
        if (!mapModelToKey)
            mapModelToKey = m => m.modelName.toUpperCase();
        this._models = {};
        this._modelTypes = {};
        this._resourcesToTypes = {};
        childModels.forEach(m => {
            this._models[mapModelToKey(m)] = m;
            this._modelTypes[mapModelToKey(m)] = m.modelName;
            let resourceName = mongooseUtils.toCollectionName(m.modelName, mongoose.pluralize());
            this._resourcesToTypes[resourceName] = m.modelName;
        });
    }

    /**
     * @obsolete - use getModel(name) instead
     * Dictionary of model name to model instance
     * @return {{}|*}
     */
    get models(){
        return this._models;
    }

    /**
     * @obsolete - use getModelType(name) instead
     * Dictionary of model name to model type name
     * @return {{}|*}
     */
    get modelTypes(){
        return this._modelTypes;
    }

    /**
     * Get the model that match the provided model key.
     * @param {String} name - the name or key of the model
     * @return {*}
     */
    getModel(name){
        return this._models[name] || this._models[name.toUpperCase()]
            || this._models[this._resourcesToTypes[name]];
    }

    /**
     * Get the model name that match the provided model key.
     * @param {String} name - the name or key of the model
     * @return {*}
     */
    getModelType(name){
        return this._modelTypes[name] || this._modelTypes[name.toUpperCase()]
            || this._modelTypes[this._resourcesToTypes[name]];
    }

    /**
     * Get the model name from a resource name. Example: creditCards resource is mapped to CreditCard type.
     * @param {String} resource - the resource name
     * @return {String}
     */
    resourceToTypeName(resource){
        return this._resourcesToTypes[resource];
    }
}

module.exports = ChildModelDirectory;