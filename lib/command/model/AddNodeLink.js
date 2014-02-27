var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.impl.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 19/02/14
 * Time: 11:41
 */
var AddNodeLink = AbstractCommand.extend({
    toString: 'AddNodeLink',

    execute: function (nodeNetwork) {
        var link = factory.createNodeLink();
        var prop = factory.createNetworkProperty();
        
        prop.name = 'ip';
        prop.value = '127.0.0.1';
        link.addNetworkProperties(prop);

        link.networkType = 'link'+(parseInt(Math.random()*100));
        link.estimatedRate = 99;
        nodeNetwork.addLink(link);
        
        return link;
    }
});

module.exports = AddNodeLink;