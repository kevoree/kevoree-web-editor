var AbstractEventProcessor = require('./AbstractEventProcessor');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 15:00
 */
var EntityEventProcessor = AbstractEventProcessor.extend({
    toString: 'EntityEventProcessor',
    
    processRemove: function (event) {
        switch (event.elementAttributeName) {
            case 'hosts':
            case 'components':
                this.ui.onRemoveHostedInstance(event.value);
                break;

            case 'subNodes':
                this.ui.onRemoveSubNode(event.value);
                break;
            
            case 'bindings':
                this.ui.onRemoveBinding(event.value);
                break;
            
            default:
                console.log(this.toString()+' unhandled remove event', event.toString());
                break;
        }
    },
    
    processAdd: function (event) {
        switch (event.elementAttributeName) {
            case 'hosts':
                this.ui.onAdd(this.editor.getModel().findNodesByID(event.value.name));
                break;

            case 'components':
                this.ui.onAdd(this.editor.getModel().findByPath(event.value.path()));
                break;
            
            case 'subNodes':
                this.ui.onAddSubNode(this.editor.getModel().findByPath(event.value.path()));
                break;

            case 'bindings':
                if (event.value.port && event.value.hub) {
                    this.ui.onAddBinding(event.value);
                }
                break;

            default:
                console.log(this.toString()+' unhandled add event', event.toString());
                break;
        }
    },
    
    processSet: function (event) {
        console.log(this.toString()+' unhandled set event', event.toString());
        this.ui.onSet(event.elementAttributeName, event.sourcePath, event.previous_value, event.value);
    }
});

module.exports = EntityEventProcessor;
