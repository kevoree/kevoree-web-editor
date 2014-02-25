var AbstractCommand = require('../AbstractCommand'),
    MergeModelCmd   = require('../model/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    Kevscript       = require('kevoree-kevscript'),
    NPMResolver     = require('../../resolver/NPMResolver'),
    JavaResolver    = require('../../resolver/JavaResolver'),
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
                java: new JavaResolver(editor)
            }
        });
        this.editorContent = null;
    },
    
    execute: function (e) {
        e.preventDefault();
        
        $('#modal-content').html(EditorTemplates['kevscript-modal'].render());

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
        }.bind(this));
        
        var modalSaveBtn = $('#modal-save');
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {
            this.editorContent = kevsEditor.getValue();
            this.kevscript.parse(this.editorContent, this.editor.getModel(), function (err, model) {
                if (err) {
                    console.log('KEVS boom', err.message);
                    return;
                }
                
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
