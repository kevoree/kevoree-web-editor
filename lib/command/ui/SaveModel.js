var Class = require('pseudoclass');
var SetModel = require('../model/SetModel');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 24/01/14.
 */
var SaveModel = Class({
    toString: 'SaveModel',

    construct: function () {
        this.serializer = new kevoree.serializer.JSONModelSerializer();
    },

    execute: function (editor) {
        console.log("SAVE MODEL");
        var model = editor.getModel();

        var mimetype = 'application/json';
        var jsonModel = JSON.stringify(JSON.parse(this.serializer.serialize(editor.getModel())), null, 4);

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
    }
});

module.exports = SaveModel;