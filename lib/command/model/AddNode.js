var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;
var Config = require('../../config/defaults');

/**
 * Created by leiko on 03/02/14.
 */
var AddNode = AbstractCommand.extend({
    toString: 'AddNode',

    construct: function (editor) {
        this.factory = new kevoree.factory.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata, containerNode) {
        var instance = this.factory.createContainerNode();

        instance.typeDefinition = tDef;
        instance.name = name || 'node'+parseInt(Math.random()*1000);
        if (metadata) {
            var val = this.factory.createValue();
            val.name = Config.META_POSITION;
            val.value = JSON.stringify(metadata);
            instance.addMetaData(val);
        }
        instance.started = true;

        if (containerNode) {
            // we do not want the editor to think this node is a top-level one
            this.editor.suspendModelListener();
            this.editor.getModel().addNodes(instance);
            this.editor.enableModelListener();
            containerNode.addHosts(instance);
        } else {
            this.editor.getModel().addNodes(instance);
        }
        
        return instance;
    }
});

module.exports = AddNode;