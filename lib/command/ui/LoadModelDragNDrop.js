var AbstractCommand = require('../AbstractCommand');
var SetModel = require('../model/SetModel');
var kevoree = require('kevoree-library').org.kevoree;
var BrowserReadFile = require('../../util/BrowserReadFile');
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var LoadModelDragNDrop = AbstractCommand.extend({
    toString: 'LoadModelDragNDrop',

    construct: function (editor) {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function (e) {
        if (e.originalEvent.dataTransfer) {
            if (e.originalEvent.dataTransfer.files.length) {
                e.preventDefault();
                e.stopPropagation();
                /*UPLOAD FILES HERE*/
                var file = e.originalEvent.dataTransfer.files[0],
                    reader = new FileReader();
                reader.onloadend = function(event) {
                    var alert = new Alert();
                    try {
                        // retrieve data from selected file
                        var model = this.loader.loadModelFromString(event.target.result).get(0);

                        // model loaded successfully
                        var cmd = new SetModel(this.editor);
                        cmd.execute(model);
                        $('#model-filename').val(file.name);
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
                }.bind(this);
                reader.readAsText(file);
            }
        }
    }
});

module.exports = LoadModelDragNDrop;