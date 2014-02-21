var AbstractCommand = require('../AbstractCommand'),
    CloseModal      = require('./CloseModal'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys');

/**
 * Created by leiko on 27/01/14.
 */
var ServerSettings = AbstractCommand.extend({
    toString: 'ServerSettings',
    
    construct: function (editor) {
        this.closeModal = new CloseModal(editor);
    },

    execute: function () {
        $('#modal-content').html(EditorTemplates['server-settings'].render({
            host: LocalStorage.get(LSKeys.HOST) || '127.0.0.1',
            port: LocalStorage.get(LSKeys.PORT) || 8080
        }));

        $('#default-settings').off('click');
        $('#default-settings').on('click', function () {
            $('#remote-host').val('127.0.0.1');
            $('#remote-port').val(8080);
        });

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var remoteHost = $('#remote-host').val();
            if (remoteHost.length > 0) LocalStorage.set(LSKeys.HOST, remoteHost);

            var remotePort = $('#remote-port').val();
            if (remotePort.length > 0) LocalStorage.set(LSKeys.PORT, remotePort);
            console.log('CLOSE MODAL SAVE SERVER SETTINGS');
            this.closeModal.execute();
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = ServerSettings;
