var Class = require('pseudoclass');
var UIKevWebEditor = require('../ui/UIKevWebEditor');
var kevoree = require('kevoree-library').org.kevoree;
var ModelHelper = require('../util/ModelHelper');

/**
 * Created by leiko on 23/01/14.
 */
var KevWebEditor = Class({
    toString: 'KevWebEditor',

    construct: function () {
        this.factory = new kevoree.impl.DefaultKevoreeFactory();
        this.model = this.factory.createContainerRoot();
        this.ui = new UIKevWebEditor(this);
    },

    addEntity: function (name, version) {
        var tDef = this.model.findTypeDefinitionsByID(name+'/'+version);
        ModelHelper.findTypeDefinitionType(tDef, {
            node: function () {

            },
            group: function () {

            },
            channel: function () {

            },
            comp: function () {

            }
        });
    },

    setModel: function (model) {
        this.model = model;
        this.ui.update();
    },

    getModel: function () {
        return this.model;
    }
});

module.exports = KevWebEditor;