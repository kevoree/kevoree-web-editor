var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteNode = AbstractCommand.extend({
    toString: 'DeleteNode',
    
    execute: function (instance) {
        if (instance.host) {
            instance.host.removeHosts(instance);
            this.editor.suspendModelListener();
            this.editor.getModel().removeNodes(instance);
            this.editor.enableModelListener();
        } else {
            this.editor.getModel().removeNodes(instance);
        }
    }
});

module.exports = DeleteNode;
