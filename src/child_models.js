const _ = require('lodash');

class ChildModels {

    /**
     * Collect all the models that assigned to the collection the passed parentModel assigned to
     * @param {Array<Model>} createdModels - list of all mongoose models to inspect
     * @param {Model} parentModel - the "parent" model
     */
    constructor(createdModels, parentModel){
        this._children = [];
        let models = _.values(createdModels);
        models.forEach(m => {
            if ((m.collection.name === parentModel.collection.name) &&
                (m.modelName !== parentModel.modelName)) {
                this._children.push(m);
            }
        });
    }

    get children(){
        return this._children;
    }

}

module.exports = ChildModels;