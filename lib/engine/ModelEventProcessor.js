var AbstractEventProcessor = require('./AbstractEventProcessor'),
    kevoree     = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 04/02/14.
 */
var ModelEventProcessor = AbstractEventProcessor.extend({
    toString: 'ModelEventProcessor',

    processAdd: function (event) {
        switch (event.elementAttributeName) {
            case 'hubs':
                this.ui.addChannel(this.editor.getModel().findByPath(event.value.path()));
                break;

            case 'nodes':
                // only add top level nodes
                // hosted nodes will be added by there respective node UIs
                if (!event.value.host) this.ui.addNode(this.editor.getModel().findByPath(event.value.path()));
                break;

            case 'groups':
                this.ui.addGroup(this.editor.getModel().findByPath(event.value.path()));
                break;

            default:
                console.warn(this.toString()+' unhandled add event ', event.toString());
                break;
        }
    },

    processSet: function (event) {
        console.warn(this.toString()+' unhandled set event ', event.toString());
    },

    processRemove: function (event) {
        switch (event.elementAttributeName) {
            case 'hubs':
            case 'nodes':
                this.ui.removeUIInstance(event.previous_value, true);
                break;

            case 'groups':
                this.ui.removeUIInstance(event.previous_value, true);
                break;

            case 'typeDefinitions':
                this.ui.update();
                break;

            default:
                console.warn(this.toString()+' unhandled remove event ', event.toString());
                break;
        }
    }
});

module.exports = ModelEventProcessor;
