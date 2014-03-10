var AbstractCommand = require('../AbstractCommand'),
    DeleteBinding   = require('./DeleteBinding');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteChannel = AbstractCommand.extend({
    toString: 'DeleteChannel',

    construct: function (editor) {
        this.deleteBinding = new DeleteBinding(editor);
    },
    
    execute: function (instance) {
//        instance.delete();
        var bindings = instance.bindings.iterator();
        while (bindings.hasNext()) this.deleteBinding.execute(bindings.next());
        this.editor.getModel().removeHubs(instance);
    }
});

module.exports = DeleteChannel;
