var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 14/02/14
 * Time: 17:21
 */
var DeleteFragDictionary = AbstractCommand.extend({
    toString: 'DeleteFragDictionary',

    execute: function (instance, fragment) {
        var fragDic = instance.findFragmentDictionaryByID(fragment.name);
        if (fragDic) {
            instance.removeFragmentDictionary(fragDic);
        }
    }
});

module.exports = DeleteFragDictionary;
