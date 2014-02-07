var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteComponent = AbstractCommand.extend({
    toString: 'DeleteComponent',
    
    execute: function (instance, nodeInstance) {
        nodeInstance.removeComponents(instance);
    }
});

module.exports = DeleteComponent;
