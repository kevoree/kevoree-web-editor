var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 03/03/14.
 */
var RemoveSubNode = AbstractCommand.extend({
    toString: 'RemoveSubNode',

    execute: function (group, node) {
        node.removeGroups(group);
        group.removeSubNodes(node);
    }
});

module.exports = RemoveSubNode;