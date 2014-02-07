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
                this.ui.onAdd(this.model.findByPath(event.getValue().path()));
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
        console.log('TODO EntityEventProcessor processSet', event);
        this.ui.onSet();
    }
});

module.exports = EntityEventProcessor;
