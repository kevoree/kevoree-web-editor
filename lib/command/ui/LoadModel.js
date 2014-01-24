var Class = require('pseudoclass');
var SetModel = require('../model/SetModel');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 24/01/14.
 */
var LoadModel = Class({
    toString: 'LoadModel',

    construct: function () {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function (editor) {
        var domFile = $('#file');
        domFile.trigger('click');

        // called when a file is selected
        domFile.on('change', function () {
            var file = domFile.get(0).files[0]; // yeah, we do not want multiple file selection
            if (domFile.get(0).files.length > 1) {
                console.warn("You have selected multiple files ("
                    +domFile.get(0).files[0].length
                    +") so I took the first one in the list ("
                    +domFile.get(0).files[0].name
                    +")");
            }
            var fReader = new FileReader();
            fReader.onload = function (event) {
                try {
                    // retrieve data from selected file
                    var jsonModel = JSON.parse(event.target.result),
                        strModel  = JSON.stringify(jsonModel),
                        model     = this.loader.loadModelFromString(strModel).get(0);

                    // model loaded successfully
                    var cmd = new SetModel();
                    cmd.execute(editor, model);
                    $('#model-name').val(file.name);

                } catch (err) {
                    // unable to load model
                }
            }.bind(this)
            fReader.readAsText(file);

            // reset input field
            domFile.off('change');
            domFile.val('');
        }.bind(this));

    }
});

module.exports = LoadModel;