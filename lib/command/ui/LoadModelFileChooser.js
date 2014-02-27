var AbstractCommand = require('../AbstractCommand');
var SetModel = require('../editor/SetModel');
var kevoree = require('kevoree-library').org.kevoree;
var BrowserReadFile = require('../../util/BrowserReadFile');
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var LoadModelFileChooser = AbstractCommand.extend({
    toString: 'LoadModelFileChooser',

    construct: function (editor) {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function (e) {
        var util = new BrowserReadFile();
        util.loadFile(function (filename, rawModel) {
            var alert = new Alert();
            try {
                // retrieve data from selected file
                var model = this.loader.loadModelFromString(rawModel).get(0);

                // model loaded successfully
                var cmd = new SetModel(this.editor);
                cmd.execute(model);
                $('#model-filename').val(filename);
                alert.setType('success');
                alert.setText('Model loaded successfully');
                alert.show(2000);

            } catch (err) {
                // unable to load model
                console.error(err.message, err.stack);
                alert.setType('danger');
                alert.setText('LoadModel error', 'Unable to load model');
                alert.show(5000);
            }
        }.bind(this));
    }
});

module.exports = LoadModelFileChooser;