var AbstractCommand = require('../AbstractCommand'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults');

/**
 * Created by leiko on 27/01/14.
 */
var Settings = AbstractCommand.extend({
    toString: 'Settings',
    
    execute: function () {
        var data = {
            settings: [
                {
                    id: LSKeys.ASK_BEFORE_LEAVING,
                    desc: 'Ask confirmation before leaving Kevoree Web Editor ?',
                    checked: LocalStorage.get(LSKeys.ASK_BEFORE_LEAVING, DefaultConf.ASK_BEFORE_LEAVING)
                }
            ]
        };

        $('#modal-content').html(EditorTemplates['settings'].render(data));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            for (var i in data.settings) {
                LocalStorage.set(data.settings[i].id, $('#'+data.settings[i].id).prop('checked'));
            }
        });

        $('#modal').modal();
    }
});

module.exports = Settings;
