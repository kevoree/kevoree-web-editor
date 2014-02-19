var AbstractCommand = require('../AbstractCommand');
var MergeModelCmd = require('../model/MergeModel');
var kevoree = require('kevoree-library').org.kevoree;
var BrowserReadFile = require('../../util/BrowserReadFile');
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var MergeModel = AbstractCommand.extend({
    toString: 'MergeModel',

    construct: function (editor) {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function () {
        var util = new BrowserReadFile();
        util.loadFile(function (fileContent) {
            try {
                // retrieve data from selected file
                var jsonModel = JSON.parse(fileContent),
                    strModel  = JSON.stringify(jsonModel),
                    model     = this.loader.loadModelFromString(strModel).get(0);

                // model loaded successfully
                var cmd = new MergeModelCmd(this.editor);
                cmd.execute(model);

            } catch (err) {
                console.log(err.message, err.stack);
                // unable to load model
                var alert = new Alert();
                alert.setType('danger');
                alert.setText('MergeModel error', 'Unable to load model');
                alert.show(5000);
            }
        }.bind(this));
    }
});

module.exports = MergeModel;