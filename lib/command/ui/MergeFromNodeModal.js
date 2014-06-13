var OpenFromNodeModal = require('./OpenFromNodeModal'),
    MergeModel        = require('../editor/MergeModel');
/**
 * Created by leiko on 27/01/14.
 */
var MergeFromNodeModal = OpenFromNodeModal.extend({
    toString: 'MergeFromNodeModal',

    construct: function () {
        this.action = 'Merge';
        this.actionCmd = new MergeModel(this.editor);
    }
});

module.exports = MergeFromNodeModal;
