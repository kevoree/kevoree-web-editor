var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddComponent = AbstractCommand.extend({
    toString: 'AddComponent',

    construct: function (editor) {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata, node) {
        var comp = this.factory.createComponentInstance();

        comp.name = name || 'comp'+parseInt(Math.random()*1000);
        comp.typeDefinition = tDef;
        comp.metaData = (metadata) ? JSON.stringify(metadata) : undefined;

        node.addComponents(comp);
        
        return comp;
    }
});

module.exports = AddComponent;