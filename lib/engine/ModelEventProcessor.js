var AbstractEventProcessor = require('./AbstractEventProcessor'),
    kevoree     = require('kevoree-library').org.kevoree,
    ModelHelper = require('../util/ModelHelper');

/**
 * Created by leiko on 04/02/14.
 */
var ModelEventProcessor = AbstractEventProcessor.extend({
    toString: 'ModelEventProcessor',

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

            case 'component':
                // component add will be made by their respective host UI
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
                this.ui.removeUIInstance(event.getPreviousValue(), true);
                break;

            default:
                console.log('unhandled remove event ', event);
                break;
        }
    }
});

module.exports = ModelEventProcessor;
