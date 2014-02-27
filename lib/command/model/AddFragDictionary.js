var AbstractCommand = require('../AbstractCommand'),
    kevoree = require('kevoree-library').org.kevoree;

var factory = new kevoree.impl.DefaultKevoreeFactory();

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
        
//        // update fragment dictionary name when fragment's name changes
//        fragment.addModelElementListener({
//            elementChanged: function (e) {
//                console.log('FRAG DIC LISTENER', e.toString());
//                if (e.getType() === kevoree.modeling.api.util.ActionType.object.SET) {
//                    if (e.getElementAttributeName() === 'name') {
//                        console.log('NAME CHANGED', fragDic.name, fragment.name);
//                        fragDic.name = fragment.name;
//                    }
//                }
//            }
//        });
        
        return fragDic;
    }
});

module.exports = AddFragDictionary;
