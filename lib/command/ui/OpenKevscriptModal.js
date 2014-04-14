var AbstractCommand = require('../AbstractCommand'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    Kevscript       = require('kevoree-kevscript'),
    NPMResolver     = require('../../resolver/NPMResolver'),
    MVNResolver     = require('../../resolver/MVNResolver'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults');

/**
 * Created by leiko on 27/01/14.
 */
var OpenKevscriptModal = AbstractCommand.extend({
    toString: 'OpenKevscriptModal',
    
    construct: function (editor) {
        this.mergeCmd = new MergeModelCmd(editor);
        this.closeModal = new CloseModalCmd(editor);
        this.kevscript = new Kevscript({
            resolvers: {
                npm: new NPMResolver(editor),
                mvn: new MVNResolver(editor)
            }
        });
        this.editorContent = null;
    },
    
    execute: function (e) {
        e.preventDefault();
        
        $('#modal-content').html(EditorTemplates['kevscript-modal'].render({
            host: LocalStorage.get(LSKeys.HOST, DefaultConf.HOST),
            port: LocalStorage.get(LSKeys.PORT, DefaultConf.PORT),
            prefix: LocalStorage.get(LSKeys.PREFIX, DefaultConf.PREFIX)
        }));

        var modal = $('#modal');
        var kevsEditor;
        modal.one('shown.bs.modal', function () {
            // Init CodeMirror KevScript editor when the modal is fully shown
            kevsEditor = CodeMirror.fromTextArea(document.getElementById('kevscript-editor'), {
                mode: 'kevscript',
                lineNumbers: true,
                styleActiveLine: true,
                extraKeys: {
                    "Ctrl-Space": "autocomplete"
                },
                lineWrapping: true,
                theme: 'kevscript'
            });

            var kevsFromModel = this.kevscript.parseModel(this.editor.getModel());
            if (kevsFromModel.length !== 0) {
                kevsEditor.setValue(kevsFromModel);
            }
        }.bind(this));

        var modalError = $('#modal-error');

        var dlKevscriptBtn = $('#download-kevscript');
        dlKevscriptBtn.off('click');
        dlKevscriptBtn.on('click', function () {
            var modelAsBlob = new Blob([kevsEditor.getValue()], {type: 'text/plain'});
            var modelName = $('#model-filename').val();
            if (!modelName || modelName.length === 0) {
                modelName = Date.now()+'.kevs';
            } else if (modelName.indexOf('.') === -1) {
                modelName = modelName+'.kevs';
            } else if (modelName.indexOf('.') !== -1) {
                modelName = modelName.split('.', modelName.match(/\./g).length).join('.')+'.kevs';
            }
            var downloadLink = document.createElement("a");
            downloadLink.download = modelName;
            downloadLink.innerHTML = "Download Kevscript Model";
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
        });
        
        var modalSaveBtn = $('#modal-save');
        var modalSaveBtnText = modalSaveBtn.text();
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {
            modalSaveBtn.text('Running...');
            modalError.addClass('hide');
            this.editorContent = kevsEditor.getValue();
            this.kevscript.parse(this.editorContent, this.editor.getModel(), function (err, model) {
                if (err) {
                    console.log('KEVS boom', err.message);
                    modalError.html(err.message);
                    modalError.removeClass('hide');
                    modalSaveBtn.text(modalSaveBtnText);
                    return;
                }

                modalSaveBtn.text(modalSaveBtnText);
                this.mergeCmd.execute(model);
                this.closeModal.execute();
            }.bind(this));
        }.bind(this));

        $('#modal-dialog').addClass('modal-lg');
        modal.modal();
        modal.one('hidden.bs.modal', function () {
            this.editorContent = kevsEditor.getValue();
            $('#modal-dialog').removeClass('modal-lg'); 
        }.bind(this));
    }
});

module.exports = OpenKevscriptModal;
