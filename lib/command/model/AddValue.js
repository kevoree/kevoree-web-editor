var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 19/02/14
 * Time: 11:41
 */
var AddValue = AbstractCommand.extend({
    toString: 'AddValue',

    execute: function (instance, name, value) {
        var val = factory.createValue();

        val.name = name;
        val.value = value;
        instance.addValues(val);
        
        return val;
    }
});

module.exports = AddValue;