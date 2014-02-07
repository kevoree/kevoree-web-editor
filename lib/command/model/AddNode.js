var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddNode = AbstractCommand.extend({
    toString: 'AddNode',

    construct: function (editor) {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata, containerNode) {
        var instance = this.factory.createContainerNode();

        instance.typeDefinition = tDef;
        instance.name = name || 'node'+parseInt(Math.random()*1000);
        instance.metaData = (metadata) ? JSON.stringify(metadata) : undefined;

        if (containerNode) {
            // we do not want the editor to think this node is a top-level one
            this.editor.suspendModelListener();
            this.editor.getModel().addNodes(instance);
            this.editor.enableModelListener();
            containerNode.addHosts(instance);
        } else {
            this.editor.getModel().addNodes(instance);
        }
    }
});

module.exports = AddNode;