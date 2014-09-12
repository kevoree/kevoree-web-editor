var Class           = require('pseudoclass'),
    ModelHelper     = require('./ModelHelper'),
    AddDictionaryValue = require('../command/model/AddDictionaryValue');

// helper function to get whether the current value or the default one if any
function getValue(dictionary, attr) {
    var val = dictionary.findValuesByID(attr.name);
    if (val) {
        return val.value;
    } else {
        return attr.defaultValue;
    }
}

// helper function to find datatype in order to display a proper input field
function getType(datatype) {
    switch (datatype) {
        case 'java.lang.Integer':
        case 'int':
        case 'number':
            return 'number';

        case 'boolean':
            return 'checkbox';

        case 'java.lang.String':
        case 'string':
        default:
            return 'text';
    }
}

module.exports = {
    /**
     * Computes properties data for instance versions
     * @param instance
     * @param model
     * @returns {Array}
     */
    getVersionsData: function (instance, model) {
        // compute data for instance versions
        var versions = [];
        var vers = ModelHelper.findTypeDefinitionVersions(instance.typeDefinition, model);
        for (var i in vers) {
            versions.push({
                version: vers[i],
                selected: (instance.typeDefinition.version === vers[i]) ? 'selected' : null
            });
        }
        return versions;
    },

    /**
     * Computes properties data for instance dictionary
     * @param instance
     */
    getDictionaryData: function (instance) {
        var dictionary = [];
        if (instance.typeDefinition.dictionaryType) {
            var attrs = instance.typeDefinition.dictionaryType.attributes.iterator();
            while (attrs.hasNext()) {
                var attr = attrs.next();
                if (!attr.fragmentDependant) {
                    var type = getType(attr.datatype);
                    var isMultiline = false;
                    var isBoolean = (type === 'checkbox');
                    var value = getValue(instance.dictionary, attr);
                    if (type === 'text' && value.contains('\n')) {
                        isMultiline = true;
                    }
                    if (isBoolean) {
                        value = (value === 'true');
                    }
                    dictionary.push({
                        name: attr.name,
                        value: value,
                        type: type,
                        isBoolean: isBoolean,
                        isMultiline: isMultiline,
                        optional: (!attr.optional && !isBoolean) ? '*' : ''
                    });
                }
            }
        }
        return dictionary;
    },

    /**
     * Computes properties data for instance fragment dictionaries
     * @param instance
     * @returns {Array}
     */
    getFragDictionariesData: function (instance) {
        // Compute data for instance fragment dictionaries
        var fragDictionaries = [];
        // find fragmentDependant attributes and set their value
        var dicType = instance.typeDefinition.dictionaryType;
        if (dicType) {
            for (var i=0; i < instance.fragmentDictionary.size(); i++) {
                var dic = [];
                for (var j=0; j < dicType.attributes.size(); j++) {
                    var attr = dicType.attributes.get(j);
                    if (attr.fragmentDependant) {
                        var type = getType(attr.datatype);
                        var isBoolean = (type === 'checkbox');
                        var isMultiline = false;
                        var value = getValue(instance.fragmentDictionary.get(i), attr);
                        if (isBoolean) {
                            value = (value === 'true');
                        }
                        if (type === 'text' && value.contains('\n')) {
                            isMultiline = true;
                        }
                        dic.push({
                            name: attr.name,
                            value: value,
                            type: type,
                            isBoolean: isBoolean,
                            isMultiline: isMultiline,
                            optional: (!attr.optional && !isBoolean) ? '*' : ''
                        });
                    }
                }

                if (dic.length > 0) {
                    fragDictionaries.push({
                        node: instance.fragmentDictionary.get(i).name,
                        active: (i === 0) ? 'active' : null,
                        dictionary: dic
                    });
                }
            }
        }
        return fragDictionaries;
    },

    /**
     * Saves instance's dictionary by reading values from DOM inputs
     * @param instance
     * @param editor
     * @param dictionary Computed dictionary data (from getDictionaryData())
     * @param [nodeName] optional fragmentDictionary node name
     */
    saveDictionary: function (instance, editor, dictionary, nodeName) {
        var addDicValCmd = new AddDictionaryValue(editor), formVal, dicVal;
        // save dictionary function
        for (var i=0; i < dictionary.length; i++) {
            if (nodeName) {
                // frag dictionary
                var fragDictionary = instance.findFragmentDictionaryByID(nodeName);
                if (dictionary[i].isBoolean) {
                    addDicValCmd.execute(fragDictionary, dictionary[i].name, $('#dic-'+nodeName+'-'+dictionary[i].name).prop('checked').toString());
                } else {
                    formVal = $('#dic-'+nodeName+'-'+dictionary[i].name).val();
                    dicVal = fragDictionary.findValuesByID(dictionary[i].name);
                    if (dicVal || (!dicVal && formVal.length > 0)) {
                        addDicValCmd.execute(fragDictionary, dictionary[i].name, formVal);
                    }
                }

            } else {
                // "normal" dictionary
                if (dictionary[i].isBoolean) {
                    addDicValCmd.execute(instance.dictionary, dictionary[i].name, $('#dic-'+dictionary[i].name).prop('checked').toString());
                } else {
                    formVal = $('#dic-'+dictionary[i].name).val();
                    dicVal = instance.dictionary.findValuesByID(dictionary[i].name);
                    if (dicVal || (!dicVal && formVal.length > 0)) {
                        addDicValCmd.execute(instance.dictionary, dictionary[i].name, formVal);
                    }
                }
            }
        }
    },

    /**
     * Saves instance's state by reading selected state-btn from DOM
     * @param instance
     */
    saveState: function (instance) {
        instance.started = $('#start-instance').parent().hasClass('active');
    },

    /**
     * Adds a "change" listener on "#instance-version" select input in order
     * to reload dictionary attributes when version changes
     * @param instance concerned model instance
     * @param model current model
     * @param cmd Open<Entity>Modal command
     */
    setVersionChangeListener: function (instance, model, cmd) {
        var select = $('#instance-version');
        select.off('change');
        select.on('change', function (e) {
            var selectedVersion = e.currentTarget.options[e.currentTarget.options.selectedIndex].innerHTML;
            if (selectedVersion !== instance.typeDefinition.version) {
                // change typeDefinition according to version
                instance.typeDefinition = model.findTypeDefinitionsByID('name='+instance.typeDefinition.name+',version='+selectedVersion);

                // remove attributes that do not exists in the new dictionary definitions
                function updateDictionary(dictionary) {
                    var previousValues = dictionary.values.iterator();
                    while (previousValues.hasNext()) {
                        var val = previousValues.next();
                        var currAttr = instance.typeDefinition.dictionaryType.findAttributesByID(val.name);
                        if (!currAttr) {
                            // attribute with name "val.name" does not exist in the new dictionary: delete it
                            dictionary.removeValues(val);
                        }
                    }
                }

                var fragDics = instance.fragmentDictionary.iterator();
                while (fragDics.hasNext()) {
                    updateDictionary(fragDics.next());
                }
                updateDictionary(instance.dictionary);

                // reload properties
                cmd.execute(instance);
            }
        }.bind(this));
    }

//    setErrorListener: function (instance) {
//        if (instance.typeDefinition.dictionaryType) {
//            var attrs = instance.typeDefinition.dictionaryType.attributes.iterator();
//            while (attrs.hasNext()) {
//                var attr = attrs.next();
//                if (!attr.optional && attr.datatype !== 'boolean') { // a boolean is always "set" because it is a checkbox
//                    var val, input, formVal;
//                    if (attr.fragmentDependant) {
//                        var fragDics = instance.fragmentDictionary.iterator();
//                        while (fragDics.hasNext()) {
//                            var fragDic = fragDics.next();
//                            input = $('dic-'+fragDic.name+'-'+attr.name);
//                            formVal = input.val();
//                            val = fragDic.findValuesByID(attr.name);
//                            if (val) {
//                                if (formVal && formVal.length > 0) {
//                                    input.parent().addClass('has-success');
//                                } else {
//                                    input.parent().addClass('has-error');
//                                }
//                            }
//                        }
//                    } else {
//                        input = $('dic-'+attr.name);
//                        formVal = input.val();
//                        val = instance.dictionary.findValuesByID(attr.name);
//                        if (val) {
//                            if (formVal && formVal.length > 0) {
//                                input.parent().addClass('has-success');
//                            } else {
//                                input.parent().addClass('has-error');
//                            }
//                        }
//                    }
//                }
//            }
//        }
//    }
};