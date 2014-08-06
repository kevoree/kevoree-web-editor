var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.factory.DefaultKevoreeFactory();

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 14/02/14
 * Time: 17:21
 */
var AddFragDictionary = AbstractCommand.extend({
    toString: 'AddFragDictionary',

    execute: function (instance, fragment) {
        var fragDic = factory.createFragmentDictionary();
        fragDic.name = fragment.name;
        
        instance.addFragmentDictionary(fragDic);

        // update fragment dictionary name when fragment's name changes
        fragment.addModelElementListener({
            elementChanged: function (e) {
                if (e.etype === kevoree.modeling.api.util.ActionType.object.SET) {
                    if (e.elementAttributeName === 'name') {
                        fragDic.name = fragment.name;
                    }
                }
            }
        });

        return fragDic;
    }
});

module.exports = AddFragDictionary;
