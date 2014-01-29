var Class = require('pseudoclass');

/**
 * Created by leiko on 28/01/14.
 */
var RemoveComponent = Class({
    toString: 'RemoveComponent',

    execute: function (node, comp) {
        node.removeComponents(comp);
    }
});

module.exports = RemoveComponent;