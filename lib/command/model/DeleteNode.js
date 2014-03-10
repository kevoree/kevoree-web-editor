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
        // delete bindings related to this node
        var comps = instance.components.iterator();
        while (comps.hasNext()) {
            var comp = comps.next();
            var provided = comp.provided.iterator();
            while (provided.hasNext()) {
                var pPort = provided.next();
                var bindings = pPort.bindings.iterator();
                while (bindings.hasNext()) {
                    var binding = bindings.next();
                    binding.hub.removeBindings(binding);
                    this.editor.getModel().removeMBindings(binding);
                }
            }
            var required = comp.required.iterator();
            while (required.hasNext()) {
                var rPort = required.next();
                var bindings = rPort.bindings.iterator();
                while (bindings.hasNext()) {
                    var binding = bindings.next();
                    binding.hub.removeBindings(binding);
                    this.editor.getModel().removeMBindings(binding);
                }
            }
        }

        // delete nodeNetworks related to this node
        var nodeNets = this.editor.getModel().nodeNetworks.iterator();
        while (nodeNets.hasNext()) {
            var nodeNet = nodeNets.next();
            if (nodeNet.target.name === instance.name) {
                this.editor.getModel().removeNodeNetworks(nodeNet);
            }
        }

        // delete links with groups
        var groups = instance.groups.iterator();
        while (groups.hasNext()) {
            var grp = groups.next();
            grp.removeSubNodes(instance);
        }

        // delete channels fragment dictionaries related to this node
        var chans = this.editor.getModel().hubs.iterator();
        while (chans.hasNext()) {
            var chan = chans.next();
            var dic = chan.findFragmentDictionaryByID(instance.name);
            if (dic) chan.removeFragmentDictionary(dic);
        }

        // remove node itself
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
