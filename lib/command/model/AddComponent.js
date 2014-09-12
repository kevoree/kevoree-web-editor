var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;
var Config = require('../../config/defaults');

/**
 * Created by leiko on 03/02/14.
 */
var AddComponent = AbstractCommand.extend({
    toString: 'AddComponent',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata, node) {
        var instance = this.factory.createComponentInstance();

        instance.name = name || 'comp'+parseInt(Math.random()*1000);
        instance.typeDefinition = tDef;
        if (metadata) {
            var val = this.factory.createValue();
            val.name = Config.META_POSITION;
            val.value = JSON.stringify(metadata);
            instance.addMetaData(val);
        }
        instance.started = true;

        node.addComponents(instance);
        
        return instance;
    }
});

module.exports = AddComponent;