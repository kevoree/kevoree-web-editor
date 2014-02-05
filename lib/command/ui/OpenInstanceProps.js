var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var OpenInstanceProps = Class({
    toString: 'OpenInstanceProps',

    execute: function (instance) {
        $('#modal-content').html(EditorTemplates['instance-properties'].render({
            title: 'Instance properties: '+instance.name

        }));

        $('#modal-save').on('click', function () {
            console.log("test");
            //$(this).off('click');
        });

        $('#modal').modal();
    }
});

module.exports = OpenInstanceProps;
