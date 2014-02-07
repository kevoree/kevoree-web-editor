var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteGroup = AbstractCommand.extend({
    toString: 'DeleteGroup',
    
    execute: function (instance) {
        this.editor.getModel().removeGroups(instance);
    }
});

module.exports = DeleteGroup;
