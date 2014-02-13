var AbstractEventProcessor = require('./AbstractEventProcessor'),
    ModelHelper = require('../util/ModelHelper');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 15:00
 */
var EntityEventProcessor = AbstractEventProcessor.extend({
    toString: 'EntityEventProcessor',
    
    processRemove: function (event) {
        this.ui.onRemove(event.getPreviousValue());
    },
    
    processAdd: function (event) {
        var type = ModelHelper.findInstanceType(event.getValue());
        switch (type) {
            case 'node':
                console.log(event);
                this.ui.onAdd(this.model.findNodesByID(event.getValue().name));
                break;

            case 'component':
                this.ui.onAdd(this.model.findByPath(event.getValue().path()));
                break;

            default:
                console.log('AbstractEntity: unhandled add event ', event);
                break;
        }
    },
    
    processSet: function (event) {
        this.ui.onSet(event.getSourcePath(), event.getElementAttributeName(), event.getValue());
    }
});

module.exports = EntityEventProcessor;
