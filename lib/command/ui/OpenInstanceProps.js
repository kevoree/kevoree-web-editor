var AbstractCommand     = require('../AbstractCommand'),
    AddDictionaryValue  = require('../model/AddDictionaryValue'),
    AddDictionary       = require('../model/AddDictionary'),
    CloseModal          = require('./CloseModal'),
    ModelHelper         = require('../../util/ModelHelper'),
    _s                  = require('underscore.string');

/**
 * Created by leiko on 27/01/14.
 */
var OpenInstanceProps = AbstractCommand.extend({
    toString: 'OpenInstanceProps',

    construct: function (editor, instanceUI) {
        this.instanceUI = instanceUI;
        this.closeModalCmd = new CloseModal(editor);
        this.addDicCmd = new AddDictionary(editor);
    },

    execute: function (instance, otherInstance) {
        var data;

        // get value from dictionary or defaultValue from attribute def
        function getValue(dictionary, attr) {
            var val = dictionary.findValuesByID(attr.name);
            if (val) return val.value;
            else return attr.defaultValue;
        }

        // save dictionary function
        var addDicValCmd = new AddDictionaryValue(this.editor);
        function saveDictionary(dictionary, nodeName) {
            for (var i=0; i < dictionary.length; i++) {
                if (nodeName) {
                    // frag dictionary
                    addDicValCmd.execute(instance.findFragmentDictionaryByID(nodeName), dictionary[i].name, $('#dic-'+nodeName+'-'+dictionary[i].name).val());

                } else {
                    // "normal" dictionary
                    addDicValCmd.execute(instance.dictionary, dictionary[i].name, $('#dic-'+dictionary[i].name).val());
                }
            }
        }
        
        if (otherInstance) {
            // properties of a wire
            data = {
                title: 'Wire properties: ' + instance.name + ' <-> ' + otherInstance.name,
                nameLabel: _s.capitalize(ModelHelper.findInstanceType(instance)+' name'),
                name: instance.name,
                otherNameLabel: _s.capitalize(ModelHelper.findInstanceType(otherInstance)+' name'),
                otherName: otherInstance.name
            };
            
        } else {
            // properties of an instance
            // compute data for instance dictionary
            var dictionary = [];
            if (!instance.dictionary) this.addDicCmd.execute(instance);
            var attrs = instance.typeDefinition.dictionaryType.attributes.iterator();
            while (attrs.hasNext()) {
                var attr = attrs.next();
                if (!attr.fragmentDependant) {
                    dictionary.push({
                        name: attr.name,
                        value: getValue(instance.dictionary, attr)
                    });
                }
            }
            
            // Compute data for instance fragment dictionaries
            var fragDictionaries = [];
            attrs = instance.typeDefinition.dictionaryType.attributes;
            for (var i=0; i < instance.fragmentDictionary.size(); i++) {
                var dic = [];
                for (var j=0; j < attrs.size(); j++) {
                    var attr = attrs.get(j);
                    if (attr.fragmentDependant) {
                        dic.push({
                            name: attr.name,
                            value: getValue(instance.fragmentDictionary.get(i), attr)
                        });
                    }
                }
                
                fragDictionaries.push({
                    node: instance.fragmentDictionary.get(i).name,
                    active: (i === 0) ? 'active' : null,
                    dictionary: dic
                });
            }
            
            data = {
                title: 'Instance properties: '+ instance.name,
                name: instance.name,
                dictionary: dictionary,
                hasFragDictionaries: instance.fragmentDictionary.size() > 0,
                fragDictionaries: fragDictionaries
            };
        }
        
        $('#modal-content').html(EditorTemplates['instance-properties'].render(data));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            if (instance.name !== name) instance.name = name;
            
            if (otherInstance) {
                var otherName = $('#other-instance-name').val();
                if (otherInstance.name !== otherName) otherInstance.name = otherName;
            
            } else {
                // save dictionary
                saveDictionary(data.dictionary);
                
                // save fragDictionaries
                for (var i in data.fragDictionaries) {
                    saveDictionary(data.fragDictionaries[i].dictionary, data.fragDictionaries[i].node);
                }
            }
            
            this.closeModalCmd.execute();
        }.bind(this));
        
        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.instanceUI.onDelete();
            this.editor.getUI().update();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenInstanceProps;
