var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.impl.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 17/02/14
 * Time: 17:19
 */
var AddNodeNetwork = AbstractCommand.extend({
    toString: 'AddNodeNetwork',

    execute: function (instance) {
        var net = factory.createNodeNetwork();
        var link = factory.createNodeLink();
        var prop = factory.createNetworkProperty();
        
        prop.name = 'ip';
        prop.value = '127.0.0.1';
        link.addNetworkProperties(prop);

        link.networkType = 'LAN';
        link.estimatedRate = 99;
        net.addLink(link);
        
        net.target = instance;
        net.initBy = instance;
        
        this.editor.getModel().addNodeNetworks(net);
    }
});

module.exports = AddNodeNetwork;