var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var Settings = Class({
    toString: 'Settings',

    execute: function () {
        $('#modal-content').html(EditorTemplates['settings'].render({
            title: 'Settings',
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

        $('#modal-save').on('click', function () {
            console.log("test");
            //$(this).off('click');
        });

        $('#modal').modal();
    }
});

module.exports = Settings;
