var AbstractCommand = require('../AbstractCommand');
var SetModel = require('../model/SetModel');
var kevoree = require('kevoree-library').org.kevoree;
var BrowserReadFile = require('../../util/BrowserReadFile');
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var LoadModel = AbstractCommand.extend({
    toString: 'LoadModel',

    construct: function (editor) {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function (fileContent) {
        var loadModel = function (rawModel) {
            try {
                // retrieve data from selected file
                var model = this.loader.loadModelFromString(rawModel).get(0);

                // model loaded successfully
                var cmd = new SetModel(this.editor);
                cmd.execute(model);

            } catch (err) {
                throw err;
                // unable to load model
                var alert = new Alert();
                alert.setType('danger');
                alert.setText('LoadModel error', 'Unable to load model');
                alert.show(5000);

            } finally {
                var alert = new Alert();
                alert.setType('success');
                alert.setText('Model loaded successfully');
                alert.show(2000);
            }
        }.bind(this);

        if (fileContent) {
            loadModel(fileContent);
        } else {
            var util = new BrowserReadFile();
            util.loadFile(loadModel);
        }
    }
});

module.exports = LoadModel;