var Class           = require('pseudoclass'),
    ModelHelper     = require('./ModelHelper'),
    AddDictionaryValue = require('../command/model/AddDictionaryValue');

// helper function to get whether the current value or the default one if any
function getValue(dictionary, attr) {
    var val = dictionary.findValuesByID(attr.name);
    if (val) return val.value;
    else return attr.defaultValue;
}

// helper function to find datatype in order to display a proper input field
function getType(datatype) {
    switch (datatype) {
        case 'java.lang.Integer':
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
        var vers = ModelHelper.findTypeDefinitionVersions(instance.typeDefinition.name, model);
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
                    if (isBoolean) value = (value === 'true');
                    dictionary.push({
                        name: attr.name,
                        value: value,
                        type: type,
                        isBoolean: isBoolean,
                        isMultiline: isMultiline
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
                        if (isBoolean) value = (value === 'true');
                        if (type === 'text' && value.contains('\n')) {
                            isMultiline = true;
                        }
                        dic.push({
                            name: attr.name,
                            value: value,
                            type: type,
                            isBoolean: isBoolean,
                            isMultiline: isMultiline
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
        var addDicValCmd = new AddDictionaryValue(editor);
        // save dictionary function
        for (var i=0; i < dictionary.length; i++) {
            if (nodeName) {
                // frag dictionary
                if (dictionary[i].isBoolean) {
                    addDicValCmd.execute(instance.findFragmentDictionaryByID(nodeName), dictionary[i].name, $('#dic-'+nodeName+'-'+dictionary[i].name).prop('checked').toString());
                } else {
                    addDicValCmd.execute(instance.findFragmentDictionaryByID(nodeName), dictionary[i].name, $('#dic-'+nodeName+'-'+dictionary[i].name).val());
                }

            } else {
                // "normal" dictionary
                if (dictionary[i].isBoolean) {
                    addDicValCmd.execute(instance.dictionary, dictionary[i].name, $('#dic-'+dictionary[i].name).prop('checked').toString());
                } else {
                    addDicValCmd.execute(instance.dictionary, dictionary[i].name, $('#dic-'+dictionary[i].name).val());
                }
            }
        }
    },

    /**
     * Saves instance's state by reading selected state-btn from DOM
     * @param instance
     */
    saveState: function (instance) {
        if ($('#start-instance').parent().hasClass('active'))
            instance.started = true;
        else
            instance.started = false;
    },

    /**
     * Adds a "change" listener on "#instance-version" select input in order
     * to reload properties when version changes
     * @param instance
     * @param model
     * @param cmd
     */
    setVersionChangeListener: function (instance, model, cmd) {
        $('#instance-version').on('change', function (e) {
            var selectedVersion = e.currentTarget.options[e.currentTarget.options.selectedIndex].innerHTML;
            if (selectedVersion !== instance.typeDefinition.version) {
                // change typeDefinition according to version
                instance.typeDefinition = model.findTypeDefinitionsByID(instance.typeDefinition.name+'/'+selectedVersion);
                // reset dictionaries
                instance.dictionary.removeAllValues();
                instance.removeAllFragmentDictionary();
                // reload properties
                cmd.execute(instance);
            }
        });
    }
};