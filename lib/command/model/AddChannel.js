var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddChannel = AbstractCommand.extend({
    toString: 'AddChannel',

    construct: function (editor) {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata) {
        var instance = this.factory.createChannel();
        var dictionary = this.factory.createDictionary();

        instance.typeDefinition = tDef;
        instance.name = name || 'chan'+parseInt(Math.random()*1000);
        instance.dictionary = dictionary;
        instance.metaData = (metadata) ? JSON.stringify(metadata) : undefined;

        this.editor.getModel().addHubs(instance);
        
        return instance;
    }
});

module.exports = AddChannel;