var Class = require('pseudoclass');
var kevoree = require('kevoree-library').org.kevoree;
var ModelHelper = require('../../util/ModelHelper');

/**
 * Created by leiko on 27/01/14.
 */
var AddEntity = Class({
    toString: 'AddEntity',

    construct: function () {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
    },

    execute: function (name, version, editor) {
        var tDef = editor.getModel().findTypeDefinitionsByID(name+'/'+version);
        ModelHelper.findTypeDefinitionType(tDef, {
            node: function () {
                console.log("addNode", name, version);

            }.bind(this),
            group: function () {
                var group = this.factory.createGroup();
                group.name = 'group'+parseInt(Math.random()*1000);
                group.typeDefinition = tDef;
                editor.addGroup(group);

            }.bind(this),
            channel: function () {
                console.log("addChannel", name, version);

            }.bind(this),
            comp: function () {
                console.log("addComponent", name, version);


            }.bind(this)
        });
    }
});

module.exports = AddEntity;
