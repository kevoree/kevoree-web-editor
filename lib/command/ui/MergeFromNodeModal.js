var OpenFromNodeModal = require('./OpenFromNodeModal'),
    MergeModel        = require('../editor/MergeModel');
/**
 * Created by leiko on 27/01/14.
 */
var MergeFromNodeModal = OpenFromNodeModal.extend({
    toString: 'MergeFromNodeModal',

    construct: function () {
        this.action = 'Merge';
    },

    pullCallback: function (err, model) {
        if (err) {
            $('#loading-layer').addClass('hide');
            $('#modal-error').html(err.message);
            $('#modal-error').removeClass('hide');
            return;
        }

        var mergeModelCmd = new MergeModel(this.editor);
        mergeModelCmd.execute(model);
        this.closeModalCmd.execute();
    }
});

module.exports = MergeFromNodeModal;
