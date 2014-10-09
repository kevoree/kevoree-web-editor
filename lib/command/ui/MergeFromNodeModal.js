var OpenFromNodeModal = require('./OpenFromNodeModal'),
    SetModelCmd       = require('../editor/SetModel'),
    kevoree           = require('kevoree-library').org.kevoree;
/**
 * Created by leiko on 27/01/14.
 */
var MergeFromNodeModal = OpenFromNodeModal.extend({
    toString: 'MergeFromNodeModal',

    construct: function () {
        this.action = 'Merge';
        this.actionCmd = new SetModelCmd(this.editor);
    },

    preProcess: function (model) {
        this._super(model);
        var compare = factory.createModelCompare();
        compare.merge(model, this.editor.getModel()).applyOn(model);
    }
});

module.exports = MergeFromNodeModal;
