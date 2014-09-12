var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;
var Config = require('../../config/defaults');

/**
 * Created by leiko on 03/02/14.
 */
var AddChannel = AbstractCommand.extend({
    toString: 'AddChannel',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata) {
        var instance = this.factory.createChannel();
        var dictionary = this.factory.createDictionary();

        instance.typeDefinition = tDef;
        instance.name = name || 'chan'+parseInt(Math.random()*1000);
        instance.dictionary = dictionary;
        if (metadata) {
            var val = this.factory.createValue();
            val.name = Config.META_POSITION;
            val.value = JSON.stringify(metadata);
            instance.addMetaData(val);
        }
        instance.started = true;

        this.editor.getModel().addHubs(instance);
        
        return instance;
    }
});

module.exports = AddChannel;