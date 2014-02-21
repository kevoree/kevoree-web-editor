var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var BrowserReadFile = Class({
    toString: 'BrowserReadFile',

    loadFile: function (callback) {
        var domFile = $('#file');
        domFile.trigger('click');

        // called when a file is selected
        domFile.off('change');
        domFile.on('change', function () {
            var file = domFile.get(0).files[0]; // yeah, we do not want multiple file selection
            if (domFile.get(0).files.length > 1) {
                console.warn("You have selected multiple files ("
                    +domFile.get(0).files[0].length
                    +") so I took the first one in the list ("
                    +domFile.get(0).files[0].name
                    +")");
            }
            console.log('FILE', file);
            var fReader = new FileReader();
            fReader.onload = function (event) {
                callback(file.name, event.target.result);
            }.bind(this)
            fReader.readAsText(file);

            // reset input field
            domFile.off('change');
            domFile.val('');
        }.bind(this));
    }
});

module.exports = BrowserReadFile;
