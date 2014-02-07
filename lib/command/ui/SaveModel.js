var AbstractCommand = require('../AbstractCommand');
var SetModel = require('../model/SetModel');
var kevoree = require('kevoree-library').org.kevoree;
var Alert = require('../../util/Alert');

/**
 * Created by leiko on 24/01/14.
 */
var SaveModel = AbstractCommand.extend({
    toString: 'SaveModel',

    construct: function (editor) {
        this.serializer = new kevoree.serializer.JSONModelSerializer();
    },

    execute: function () {
        var model = this.editor.getModel();
        if (model.typeDefinitions.size() > 0 || model.nodes.size() > 0 || model.groups.size() > 0 || model.hubs.size() > 0) {
            var mimetype = 'application/json';
            var jsonModel = JSON.stringify(JSON.parse(this.serializer.serialize(this.editor.getModel())), null, 4);

            var modelAsBlob = new Blob([jsonModel], {type: mimetype});
            var modelName = $('#model-name').val();
            if (!modelName || modelName.length === 0) {
                modelName = Date.now()+'.json';
            } else if (modelName.indexOf('.') === -1) {
                modelName = modelName+'.json';
            }

            var downloadLink = document.createElement("a");
            downloadLink.download = modelName;
            downloadLink.innerHTML = "Download Kevoree Model";
            if (window.webkitURL != null) {
                // Chrome allows the link to be clicked
                // without actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(modelAsBlob);
            } else {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(modelAsBlob);
                downloadLink.onclick = function (e) {
                    document.body.removeChild(e.target)
                };
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }

            downloadLink.click();
        } else {
            var alert = new Alert();
            alert.setType('warning');
            alert.setText('Save model', 'Nothing to save here :/');
            alert.show(3500);
        }
    }
});

module.exports = SaveModel;