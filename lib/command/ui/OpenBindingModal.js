var AbstractCommand = require('../AbstractCommand'),
    ModelHelper     = require('../../util/ModelHelper'),
    AddChannel      = require('../model/AddChannel'),
    AddBinding      = require('../model/AddBinding');

/**
 * Created by leiko on 23/04/14.
 */
var OpenSettingsModal = AbstractCommand.extend({
    toString: 'OpenBindingModal',

    construct: function (editor) {
        this.addChanCmd = new AddChannel(editor);
        this.addBindingCmd = new AddBinding(editor);
    },
    
    execute: function (srcPort, targetPort) {
        this.srcPort    = srcPort;
        this.targetPort = targetPort;
        this.chans      = ModelHelper.getChannelTypes(this.editor.getModel());

        var channels = [];
        for (var i in this.chans) {
            if (channels.indexOf(this.chans[i].name) === -1) {
                channels.push(this.chans[i].name);
            }
        }

        $('#modal-content').html(EditorTemplates['binding-modal'].render({ channels: channels }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var chanName = $('#channel-select option:selected').val();
            for (var i in this.chans) {
                if (this.chans[i].name === chanName) {
                    var chan = this.addChanCmd.execute(this.chans[i]);
                    this.addBindingCmd.execute(this.srcPort, chan);
                    this.addBindingCmd.execute(this.targetPort, chan);
                    return;
                }
            }
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenSettingsModal;
