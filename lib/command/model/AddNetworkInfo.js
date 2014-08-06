var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 17/02/14
 * Time: 17:19
 */
var AddNetworkInfo = AbstractCommand.extend({
    toString: 'AddNetworkInfo',

    execute: function (instance, name) {
        var net = factory.createNetworkInfo();
        net.name = name;

        instance.addNetworkInformation(net);
        
        return net;
    }
});

module.exports = AddNetworkInfo;