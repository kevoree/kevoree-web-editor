var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteChannel = AbstractCommand.extend({
    toString: 'DeleteChannel',
    
    execute: function (instance) {
        this.editor.getModel().removeHubs(instance);
    }
});

module.exports = DeleteChannel;
