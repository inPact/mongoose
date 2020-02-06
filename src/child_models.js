const _ = require('lodash');

class ChildModels {

    /**
     * Collect all the models that assigned to the collection the passed parentModel assigned to
     * @param {Array<Model>} createdModels - list of all mongoose models to inspect
     * @param {Model} parentModel - the "parent" model
     */
    constructor(createdModels, parentModel){
        this._children = [];
        const models = _.values(createdModels);
        let printed = false;
        models.forEach(m => {
            try{
                if ( (!_.isUndefined(m) && !_.isUndefined(m.collection)) &&
                    (m.collection.name === parentModel.collection.name) &&
                    (m.modelName !== parentModel.modelName)) {
                    this._children.push(m);
                }
            }catch(e){
                console.log(JSON.stringify(m))                
                console.log(JSON.stringify(models))
                throw e;
            }
        });
    }

    get children(){
        return this._children;
    }

}

module.exports = ChildModels;