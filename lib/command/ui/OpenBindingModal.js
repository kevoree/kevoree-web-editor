var AbstractCommand = require('../AbstractCommand'),
    ModelHelper     = require('../../util/ModelHelper'),
    AddChannel      = require('../model/AddChannel'),
    AddBinding      = require('../model/AddBinding'),
    kevoree         = require('kevoree-library').org.kevoree,
    Kotlin          = require('kevoree-kotlin');

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
        function checkAvailability(name) {
            for (var i=0; i < channels.length; i++) {
                if (channels[i].optTxt === name) {
                    return false;
                }
            }
            return true;
        }

        for (var i in this.chans) {
            if (checkAvailability(this.chans[i].name)) {
                channels.push({
                    optVal: this.chans[i].path(),
                    optTxt: this.chans[i].name
                });
            }
        }

        var hubs = this.editor.getModel().hubs.iterator();
        while (hubs.hasNext()) {
            var hub = hubs.next();
            channels.push({
                optVal: hub.path(),
                optTxt: hub.name + ' : ' + hub.typeDefinition.name
            });
        }

        $('#modal-content').html(templates['binding-modal'].render({ channels: channels }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var chanPath = $('#channel-select option:selected').val();
            var modelElement = this.editor.getModel().findByPath(chanPath);
            if (Kotlin.isType(modelElement, kevoree.TypeDefinition)) {
                modelElement = this.addChanCmd.execute(modelElement);
            }

            this.addBindingCmd.execute(this.srcPort, modelElement);
            this.addBindingCmd.execute(this.targetPort, modelElement);
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenSettingsModal;
