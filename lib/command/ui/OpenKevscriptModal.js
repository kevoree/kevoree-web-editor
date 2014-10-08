var AbstractCommand = require('../AbstractCommand'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    Kevscript       = require('kevoree-kevscript'),
    _               = require('underscore.string');

var fs = require('fs');
var JS_CHAT = fs.readFileSync(__dirname+'/../../samples/js_chat.kevs', 'utf8');

/**
 * Created by leiko on 27/01/14.
 */
var OpenKevscriptModal = AbstractCommand.extend({
    toString: 'OpenKevscriptModal',
    
    construct: function (editor) {
        this.mergeCmd = new MergeModelCmd(editor);
        this.closeModal = new CloseModalCmd(editor);
        this.kevscript = new Kevscript();
    },
    
    execute: function (e) {
        e.preventDefault();
        var modal = $('#modal');
        var kevsEditor, kevsFromModel;

        var sources = {
            editor: {
                name: 'From editor',
                getKevScript: function () {
                    return kevsFromModel;
                }
            },
            "js-chat": {
                name: 'Chat (javascript)',
                getKevScript: function () {
                    return JS_CHAT;
                }
            }
        };

        $('#modal-content').html(templates['kevscript-modal'].render({
            sources: (function () {
                var data = [];
                for (var key in sources) {
                    if (sources.hasOwnProperty(key)) {
                        sources[key].id = key;
                        data.push(sources[key]);
                    }
                }
                return data;
            })(sources)
        }));

        var modalSaveBtn = $('#modal-save');

        modal.one('shown.bs.modal', function () {
            // Init CodeMirror KevScript editor when the modal is fully shown
            kevsEditor = CodeMirror.fromTextArea(document.getElementById('kevscript-editor'), {
                mode: 'kevscript',
                lineNumbers: true,
                styleActiveLine: true,
                extraKeys: {
                    "Ctrl-Space": "autocomplete",
                    "Ctrl-Alt-Enter": function () {
                        modalSaveBtn.click();
                    }
                },
                lineWrapping: true,
                theme: 'kevscript'
            });

            kevsFromModel = this.kevscript.parseModel(this.editor.getModel());
            if (kevsFromModel.length !== 0) {
                kevsEditor.setValue(kevsFromModel);
            } else {
                kevsFromModel = kevsEditor.getValue();
            }
        }.bind(this));

        $('#kevscript-source-selector').on('change', function () {
            var content = sources[$(this).val()].getKevScript() || '';
            kevsEditor.setValue(content);
        });

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
        
        var modalSaveBtnText = modalSaveBtn.text();
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {
            modalSaveBtn.text('Running...');
            modalError.addClass('hide');

            function errorHandler(err) {
                modalError.html(_.capitalize(err.message));
                modalError.removeClass('hide');
                modalSaveBtn.text(modalSaveBtnText);
                console.error(err.stack);
            }

            try {
                this.kevscript.parse(kevsEditor.getValue(), this.editor.getModel(), function (err, model) {
                    if (err) {
                        errorHandler(err);
                    } else {
                        modalSaveBtn.text(modalSaveBtnText);
                        this.mergeCmd.execute(model);
                        this.closeModal.execute();
                    }
                }.bind(this));
            } catch (err) {
                errorHandler(err);
            }
        }.bind(this));

        $('#modal-dialog').addClass('modal-lg');
        modal.modal();
        modal.one('hidden.bs.modal', function () {
            $('#modal-dialog').removeClass('modal-lg');
        }.bind(this));
    }
});

module.exports = OpenKevscriptModal;
