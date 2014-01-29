var Class = require('pseudoclass');
var kevoree = require('kevoree-library').org.kevoree;
var ModelHelper = require('../../util/ModelHelper');

/**
 * Created by leiko on 27/01/14.
 */
var AddInstance = Class({
    toString: 'AddInstance',

    construct: function () {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (name, container, tDefName, version, editor, metadata) {
        var tDef = editor.getModel().findTypeDefinitionsByID(tDefName+'/'+version);
        ModelHelper.findTypeDefinitionType(tDef, {
            node: function () {
                var node = this.factory.createContainerNode();
                node.name = name || 'node'+parseInt(Math.random()*1000);
                node.typeDefinition = tDef;
                node.metaData = JSON.stringify(metadata);
                editor.addNode(node);

            }.bind(this),
            group: function () {
                var group = this.factory.createGroup();
                group.name = name || 'group'+parseInt(Math.random()*1000);
                group.typeDefinition = tDef;
                group.metaData = JSON.stringify(metadata);
                editor.addGroup(group);

            }.bind(this),
            channel: function () {
                var chan = this.factory.createChannel();
                chan.name = name || 'chan'+parseInt(Math.random()*1000);
                chan.typeDefinition = tDef;
                chan.metaData = JSON.stringify(metadata);
                editor.addChannel(chan);

            }.bind(this),
            component: function () {
                var comp = this.factory.createComponentInstance();
                comp.name = name || 'comp'+parseInt(Math.random()*1000);
                comp.typeDefinition = tDef;
                comp.metaData = JSON.stringify(metadata);
                container.addComponents(comp);

            }.bind(this)
        });
    }
});

module.exports = AddInstance;
