var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 27/01/14.
 */
var Settings = AbstractCommand.extend({
    toString: 'Settings',
    
    execute: function () {
        $('#modal-content').html(EditorTemplates['settings'].render({
            settings: [
                {
                    desc: 'Lorem ipsum dolor sit amet',
                    checked: false
                },
                {
                    desc: 'Foo bar and da potatoes crew',
                    checked: true
                }
            ]
        }));

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            console.log("TODO: save settings to LocalStorage");
        });

        $('#modal').modal();
    }
});

module.exports = Settings;
