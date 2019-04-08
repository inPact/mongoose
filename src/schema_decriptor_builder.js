const _ = require('lodash');

class SchemaDescriptionBuilder {
    constructor(model, updateParamKeys) {
        this._model = model;
        this._updateParamKeys = updateParamKeys;
    }

    build(){
        let model = this._model;
        let path = this._model.schema.paths;
        let updateParamKeys = this._updateParamKeys || '*';
        let result = {};

        for (let p in path) {
            if (path.hasOwnProperty(p)) {
                let schemaPropData = path[p];
                let pathSegments = p.split('.');

                if (updateParamKeys === '*' || updateParamKeys.find(upk => upk === pathSegments[0])) {
                    let target = result;
                    let parentTarget = target;

                    pathSegments.forEach(seg => {
                        if (!target[seg])
                            target[seg] = {};
                        parentTarget = target;
                        target = target[seg];
                    });

                    if (schemaPropData.instance === 'Array') {
                        target = parentTarget[pathSegments[pathSegments.length - 1]] = { type: [] };
                        setSchemaObjectOptions(target, schemaPropData);
                        if (schemaPropData.schema) {
                            let desc = new SchemaDescriptionBuilder(schemaPropData).build();
                            target.type.push(desc);
                        } else if (schemaPropData.caster) {
                            target.type.push(fillSchemaObjectDescription({}, schemaPropData.caster));
                        }
                    }
                    else {
                        fillSchemaObjectDescription(target, schemaPropData);
                    }
                }
            }
        }

        if (model.extendSchema)
            result.behavior = _.assign({}, model.extendSchema());

        return result;
    }
}


function fillSchemaObjectDescription(target, desciptor) {
    target.type = desciptor.instance;
    if (desciptor.enumValues && desciptor.enumValues.length) {
        target.enum = desciptor.enumValues;
    }
    setSchemaObjectOptions(target, desciptor);
    return target;
}

function setSchemaObjectOptions(target, descriptor) {
    if (descriptor.options) {
        target.ref = descriptor.options.ref;
        target.required = descriptor.options.required;
        target.default = descriptor.options.default;
        let match = _.toString(descriptor.options.match);
        if(!_.isEmpty(match))
            target.match = match;
    }
}

module.exports = SchemaDescriptionBuilder;