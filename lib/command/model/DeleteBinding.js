var AbstractCommand = require('../AbstractCommand');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteBinding = AbstractCommand.extend({
    toString: 'DeleteBinding',
    
    execute: function (binding) {
        if (binding.port) binding.port.removeBindings(binding);
        if (binding.hub)  binding.hub.removeBindings(binding);
        this.editor.getModel().removeMBindings(binding);
    }
});

module.exports = DeleteBinding;
