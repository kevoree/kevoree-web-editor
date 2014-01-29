var Class = require('pseudoclass');
var EditorMergeModel = require('../model/MergeModel');
var kevoree = require('kevoree-library').org.kevoree;
var BrowserReadFile = require('../../util/BrowserReadFile');
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var MergeModel = Class({
    toString: 'MergeModel',

    construct: function () {
        this.loader = new kevoree.loader.JSONModelLoader();
    },

    execute: function (editor) {
        var util = new BrowserReadFile();
        util.readFile(function (fileContent) {
            try {
                // retrieve data from selected file
                var jsonModel = JSON.parse(fileContent),
                    strModel  = JSON.stringify(jsonModel),
                    model     = this.loader.loadModelFromString(strModel).get(0);

                // model loaded successfully
                var cmd = new EditorMergeModel();
                cmd.execute(editor, model);

            } catch (err) {
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