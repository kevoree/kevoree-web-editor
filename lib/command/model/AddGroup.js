var AbstractCommand = require('../AbstractCommand');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 03/02/14.
 */
var AddGroup = AbstractCommand.extend({
    toString: 'AddGroup',

    construct: function (editor) {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (tDef, name, metadata) {
        var instance = this.factory.createGroup();

        instance.typeDefinition = tDef;
        instance.name = name || 'group'+parseInt(Math.random()*1000);
        instance.metaData = (metadata) ? JSON.stringify(metadata) : undefined;

        this.editor.getModel().addGroups(instance);
    }
});

module.exports = AddGroup;