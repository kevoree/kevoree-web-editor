var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteNode = AbstractCommand.extend({
    toString: 'DeleteNode',
    
    execute: function (instance, hostInstance) {
        if (hostInstance) {
            hostInstance.removeHosts(instance);
        } else {
            this.editor.getModel().removeNodes(instance);
        }
    }
});

module.exports = DeleteNode;
