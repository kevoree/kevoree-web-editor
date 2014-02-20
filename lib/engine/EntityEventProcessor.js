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
        console.log('REMOVE REMOVE REMOVE REMOVE', event);
        switch (event.getElementAttributeName()) {
            case 'hosts':
            case 'components':
                this.ui.onRemoveHostedInstance(event.getValue());
                break;

            case 'subNodes':
                this.ui.onRemoveSubNode(event.getValue());
                break;
            
            case 'bindings':
                this.ui.onRemoveBinding(event.getValue());
                break;
            
            default:
                console.log(this.toString()+' unhandled remove event', event.toString());
                break;
        }
    },
    
    processAdd: function (event) {
        switch (event.getElementAttributeName()) {
            case 'hosts':
                this.ui.onAdd(this.editor.getModel().findNodesByID(event.getValue().name));
                break;

            case 'components':
                this.ui.onAdd(this.editor.getModel().findByPath(event.getValue().path()));
                break;
            
            case 'subNodes':
                this.ui.onAddSubNode(this.editor.getModel().findByPath(event.getValue().path()));
                break;
        }
    },
    
    processSet: function (event) {
        this.ui.onSet(event.getElementAttributeName(), event.getSourcePath(), event.getPreviousValue(), event.getValue());
    }
});

module.exports = EntityEventProcessor;
