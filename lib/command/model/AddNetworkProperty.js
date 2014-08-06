var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 19/02/14
 * Time: 11:41
 */
var AddNetworkProperty = AbstractCommand.extend({
    toString: 'AddNetworkProperty',

    execute: function (networkInfo, name, value) {
        var prop = factory.createNetworkProperty();
        
        prop.name = name;
        prop.value = value;
        networkInfo.addValues(prop);
        
        return prop;
    }
});

module.exports = AddNetworkProperty;