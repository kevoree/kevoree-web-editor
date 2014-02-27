var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.impl.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 17/02/14
 * Time: 11:18
 */
var AddDictionaryValue = AbstractCommand.extend({
    toString: 'AddDictionaryValue',

    execute: function (dictionary, name, value) {
        var val = dictionary.findValuesByID(name);
        if (!val) {
            val = factory.createDictionaryValue();
            val.name = name;
            dictionary.addValues(val);
        }

        val.value = value;
        
        return val;
    }
});

module.exports = AddDictionaryValue;