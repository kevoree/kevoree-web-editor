var AbstractCommand = require('../AbstractCommand'),
    LoadStdLibCmd   = require('../network/LoadStdLibraries'),
    MergeLibCmd     = require('../network/MergeLibrary'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults');

var URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}(\.[a-z]{2,6})?\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

/**
 * Created by leiko on 27/01/14.
 */
var OpenCustomRepoModal = AbstractCommand.extend({
    toString: 'OpenCustomRepoModal',
    
    construct: function (editor) {
        this.remoteLoadCmd = new LoadStdLibCmd(editor);
        this.remoteMergeCmd = new MergeLibCmd(editor);
        this.mergeCmd = new MergeModelCmd(editor);
        this.closeModal = new CloseModalCmd(editor);
    },
    
    execute: function () {
        var libraries = [];

        // set modal view content
        $('#modal-content').html(EditorTemplates['custom-repo-modal'].render({
            host:       LocalStorage.get(LSKeys.HOST, DefaultConf.HOST),
            port:       LocalStorage.get(LSKeys.PORT, DefaultConf.PORT),
            prefix:     LocalStorage.get(LSKeys.PREFIX, DefaultConf.PREFIX),
            libraries:  libraries
        }));

        var loadLibBtn = $('#load-lib-btn');

        $('#repo-url').on('change paste keyup', function () {
            var val = $(this).val();
            if (val.match(URL_REGEX)) {
                loadLibBtn.removeAttr('disabled');
            } else {
                loadLibBtn.attr('disabled', true);
            }
        });

        loadLibBtn.on('click', function () {
            loadLibBtn.attr('disabled', true);
            loadLibBtn.html('Loading<span class="dot one">.</span><span class="dot two">.</span><span class="dot three">.</span>');

            var libz = {
                java: [
                    {
                        groupID: $('#lib-group-id').val(),
                        artifactID: $('#lib-artifact-id').val(),
                        version: $('#lib-version').val()
                    }
                ]
            };

            this.remoteMergeCmd.execute(libz, [ $('#repo-url').val() ], function (err, model) {
                if (err) {
                    console.log("BOUM", err);
                    loadLibBtn.attr('disabled', false);
                    loadLibBtn.html('Load library');
                    return;
                }

                this.mergeCmd.execute(model);
                this.closeModal.execute();
            }.bind(this));
        }.bind(this));
        
        var modalSaveBtn = $('#modal-save');
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {

        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenCustomRepoModal;
