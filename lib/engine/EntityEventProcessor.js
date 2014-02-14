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
        switch (event.getElementAttributeName()) {
            case 'hosts':
            case 'components':
                this.ui.onRemoveHostedInstance(event.getValue());
                break;
            
            default:
                this.ui.onRemove(event.getPreviousValue());
                break;
        }
    },
    
    processAdd: function (event) {
        console.log(event);
        switch (event.getElementAttributeName()) {
            case 'hosts':
                this.ui.onAdd(this.model.findNodesByID(event.getValue().name));
                break;

            case 'components':
                this.ui.onAdd(this.model.findByPath(event.getValue().path()));
                break;
        }
    },
    
    processSet: function (event) {
        this.ui.onSet(event.getSourcePath(), event.getElementAttributeName(), event.getValue());
    }
});

module.exports = EntityEventProcessor;
