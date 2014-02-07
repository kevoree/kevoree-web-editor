var AbstractCommand = require('../AbstractCommand');

/**
 * Created by leiko on 27/01/14.
 */
var Settings = AbstractCommand.extend({
    toString: 'Settings',
    
    construct: function (editor) {
        this.modalSaveBtn = $('#modal-save');
    },

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

        this.modalSaveBtn.off('click');
        this.modalSaveBtn.on('click', function () {
            console.log("test");
        });

        $('#modal').modal();
    }
});

module.exports = Settings;
