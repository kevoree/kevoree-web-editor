var Class       = require('pseudoclass'),
    kevoree     = require('kevoree-library').org.kevoree,
    ModelHelper = require('../util/ModelHelper');

var ActionType = kevoree.modeling.api.util.ActionType;

/**
 * Created by leiko on 04/02/14.
 */
var ModelEventProcessor = Class({
    toString: 'ModelEventProcessor',

    construct: function (model, ui) {
        this.model = model;
        this.ui = ui;
    },

    setModel: function (model) {
        this.model = model;
    },

    processor: function () {
        return {
            elementChanged : function (event) {
//                console.log("EVENT", event);

                if      (event.getType() === ActionType.object.REMOVE)  this.processRemove(event);
                else if (event.getType() === ActionType.object.ADD)     this.processAdd(event);
                else if (event.getType() === ActionType.object.SET)     this.processSet(event);
                else console.log('Editor unhandled event', event);

            }.bind(this)
        }
    },

    processAdd: function (event) {
        var element = event.getValue();
//        console.log('ADD', element);
        var type = ModelHelper.findInstanceType(element);
        switch (type) {
            case 'channel':
                this.ui.addChannel(this.model.findByPath(element.path()));
                break;

            case 'node':
                // only add top level nodes
                // hosted nodes will be added by there respective node UIs
                if (!element.host) this.ui.addNode(this.model.findByPath(element.path()));
                break;

            case 'group':
                this.ui.addGroup(this.model.findByPath(element.path()));
                break;

            default:
                console.log('unhandled add event ', event);
                break;
        }
    },

    processSet: function (event) {
//        console.log('SET', event);
    },

    processRemove: function (event) {
        var element = event.getValue();
//        console.log('REMOVE', event.getPreviousValue());

        var type = ModelHelper.findInstanceType(element);
        switch (type) {
            case 'channel':
            case 'node':
            case 'group':
            case 'component':
                this.ui.removeInstance(event.getPreviousValue());
                break;

            default:
                console.log('unhandled remove event ', event);
                break;
        }
    }
});

module.exports = ModelEventProcessor;
