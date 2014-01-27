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

    addGroup: function (instance) {
        this.model.addGroups(instance);
    },

    addNode: function (instance) {
        this.model.addNodes(instance);
    },

    addChannel: function (instance) {
        this.model.addHubs(instance);
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