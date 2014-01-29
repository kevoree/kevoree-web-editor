var Class = require('pseudoclass');

/**
 * Created by leiko on 28/01/14.
 */
var AddComponent = Class({
    toString: 'AddComponent',

    execute: function (node, comp) {
        node.addComponents(comp);
    }
});

module.exports = AddComponent;