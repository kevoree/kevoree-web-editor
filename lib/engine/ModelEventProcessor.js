var AbstractEventProcessor = require('./AbstractEventProcessor'),
    kevoree     = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 04/02/14.
 */
var ModelEventProcessor = AbstractEventProcessor.extend({
    toString: 'ModelEventProcessor',

    processAdd: function (event) {
        var element = event.getValue();
        switch (event.getElementAttributeName()) {
            case 'hubs':
                this.ui.addChannel(this.model.findByPath(element.path()));
                break;

            case 'nodes':
                // only add top level nodes
                // hosted nodes will be added by there respective node UIs
                if (!element.host) this.ui.addNode(this.model.findByPath(element.path()));
                break;

            case 'groups':
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
//        console.log('REMOVE', event.getPreviousValue());
        switch (event.getElementAttributeName()) {
            case 'hubs':
            case 'nodes':
            case 'groups':
            case 'components':
                this.ui.removeUIInstance(event.getPreviousValue(), true);        
                break;

            default:
                console.log('unhandled remove event ', event);
                break;
        }
    }
});

module.exports = ModelEventProcessor;
