var AbstractCommand = require('../AbstractCommand'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    Kevscript       = require('kevoree-kevscript'),
    NPMResolver     = require('../../resolver/NPMResolver'),
    MVNResolver     = require('../../resolver/MVNResolver'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults'),
    _s              = require('underscore.string');

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
            host: LocalStorage.get(LSKeys.HOST) || DefaultConf.HOST,
            port: LocalStorage.get(LSKeys.PORT) || DefaultConf.PORT
        }));

        var kevsEditor;
        $('#modal').one('shown.bs.modal', function () {
            // Init CodeMirror KevScript editor when the modal is fully shown
            kevsEditor = CodeMirror.fromTextArea(document.getElementById('kevscript-editor'), {
                mode: 'text',
                lineNumbers: true,
                styleActiveLine: true,
                matchBrackets: true,
                lineWrapping: true,
                theme: 'ambiance'
            });
            
            if (this.editorContent) kevsEditor.setValue(this.editorContent);
            
//            // register Ctrl+s shortcut for Kevscript saving
//            Mousetrap.bind(['command+s', 'ctrl+s'], function (e) {
//                console.log('CTRL S KEVS');
//                e.preventDefault();
//                var mimetype = 'text/plain';
//                try {
//                    var modelAsBlob = new Blob([kevsEditor.getValue()], {type: mimetype});
//                    var kevscriptName = $('#kevscript-filename').val();
//                    if (!kevscriptName || kevscriptName.length === 0) {
//                        kevscriptName = 'kevs'+Date.now()+'.kevs';
//                    } else if (kevscriptName.indexOf('.') === -1) {
//                        kevscriptName = kevscriptName+'.kevs';
//                    }
//
//                    var downloadLink = document.createElement("a");
//                    downloadLink.download = kevscriptName;
//                    downloadLink.innerHTML = "Download Kevoree Kevscript";
//                    if (window.webkitURL != null) {
//                        // Chrome allows the link to be clicked
//                        // without actually adding it to the DOM.
//                        downloadLink.href = window.webkitURL.createObjectURL(modelAsBlob);
//                    } else {
//                        // Firefox requires the link to be added to the DOM
//                        // before it can be clicked.
//                        downloadLink.href = window.URL.createObjectURL(modelAsBlob);
//                        downloadLink.onclick = function (e) {
//                            document.body.removeChild(e.target)
//                        };
//                        downloadLink.style.display = "none";
//                        document.body.appendChild(downloadLink);
//                    }
//
//                    downloadLink.click();
//
//                } catch (err) {
//                    console.error('Unable to save current Kevscript to file\n', err.stack);
//                    var alert = new Alert();
//                    alert.setType('danger');
//                    alert.setText('Save Kevscript', 'Failed to save Kevscript :/');
//                    alert.show(3500);
//                }
//            });
        }.bind(this));
        
        var modalError = $('#modal-error');
        
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
        $('#modal').modal();
        $('#modal').one('hidden.bs.modal', function () {
            this.editorContent = kevsEditor.getValue();
            $('#modal-dialog').removeClass('modal-lg'); 
        }.bind(this));
    }
});

module.exports = OpenKevscriptModal;
