var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;
var Config = require('../../config/defaults');

/**
 * Created by leiko on 03/02/14.
 */
var AddGroup = AbstractCommand.extend({
    toString: 'AddGroup',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata) {
        var instance = this.factory.createGroup();

        instance.typeDefinition = tDef;
        instance.name = name || 'group'+parseInt(Math.random()*1000);
        if (metadata) {
            var val = this.factory.createValue();
            val.name = Config.META_POSITION;
            val.value = JSON.stringify(metadata);
            instance.addMetaData(val);
        }
        instance.started = true;

        this.editor.getModel().addGroups(instance);
        
        return instance;
    }
});

module.exports = AddGroup;