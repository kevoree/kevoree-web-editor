var AbstractCommand = require('../AbstractCommand'),
    DeleteBinding   = require('./DeleteBinding');

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 12:26
 */
var DeleteComponent = AbstractCommand.extend({
    toString: 'DeleteComponent',

    construct: function (editor) {
        this.delBindingCmd = new DeleteBinding(editor);
    },
    
    execute: function (instance) {
        function deleteBindings(ports) {
            while (ports.hasNext()) {
                var bindings = ports.next().bindings.iterator();
                while (bindings.hasNext()) {
                    this.delBindingCmd.execute(bindings.next());
                }
            }
        }

        deleteBindings.bind(this)(instance.provided.iterator());
        deleteBindings.bind(this)(instance.required.iterator());
        instance.eContainer().removeComponents(instance);
    }
});

module.exports = DeleteComponent;
