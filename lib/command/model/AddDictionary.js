var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.impl.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 14/02/14
 * Time: 17:21
 */
var AddDictionary = AbstractCommand.extend({
    toString: 'AddDictionary',

    execute: function (instance) {
        instance.dictionary = factory.createDictionary();
        return instance.dictionary;
    }
});

module.exports = AddDictionary;
