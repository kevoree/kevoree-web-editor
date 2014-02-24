var AbstractCommand = require('../AbstractCommand'),
    LoadStdLibCmd   = require('../network/LoadStdLibraries'),
    MergeLibCmd     = require('../network/MergeLibrary'),
    MergeModelCmd   = require('../model/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    _s              = require('underscore.string');

var LIBS = ['java', 'javascript'];

/**
 * Created by leiko on 27/01/14.
 */
var OpenStdLibsModal = AbstractCommand.extend({
    toString: 'OpenStdLibsModal',
    
    construct: function (editor) {
        this.remoteLoadCmd = new LoadStdLibCmd(editor);
        this.remoteMergeCmd = new MergeLibCmd(editor);
        this.mergeCmd = new MergeModelCmd(editor);
        this.closeModal = new CloseModalCmd(editor);
    },
    
    execute: function () {
        var libraries = LIBS.map(function (lib, index) {
            var obj = {};
            if (index == 0) obj.first = true;
            obj.name = _s.capitalize(lib);
            return obj;
        });
        
        $('#modal-content').html(EditorTemplates['std-libraries-modal'].render({ libraries: libraries }));
        
        for (var i in libraries) {
            (function (lib) {
                this.remoteLoadCmd.execute(lib.toLowerCase(), function (err, libs) {
                    if (err) {
                        var domLibLoading = $('#'+lib+'-loading');
                        domLibLoading.find('.text').addClass('text-warning').html(err.message);
                        domLibLoading.find('.progress').removeClass('progress-striped active');
                        domLibLoading.find('.progress-bar').addClass('progress-bar-danger').html('Loading failed :/');
                        console.log('BOUM '+lib, err.message);
                        return;
                    }

                    var domLibLoading = $('#'+lib+'-loading');
                    console.log('right', lib, domLibLoading);
                    domLibLoading.find('.progress').removeClass('progress-striped active');
                    domLibLoading.find('.progress-bar').addClass('progress-bar-success').html('Loaded successfully');
                    setTimeout(function () {
                        $('#'+lib).html(EditorTemplates['std-libraries-list'].render({ platform: lib.toLowerCase(), libraries: libs }));
                        $('.std-lib-item').off('click');
                        $('.std-lib-item').on('click', function () {
                            var input = $(this).find('input');
                            input.prop('checked', !input.prop('checked'));
                        });
                    }.bind(this), 1000);
                }.bind(this));
            }.bind(this))(libraries[i].name);
        }

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            console.log("TODO: merge libraries");
            var libsToMerge = {};
            $('.std-lib-item input:checked').each(function () {
                console.log("====");
                libsToMerge[this.parentElement.parentElement.dataset.platform] =
                    libsToMerge[this.parentElement.parentElement.dataset.platform] || [];
                libsToMerge[this.parentElement.parentElement.dataset.platform].push({
                    groupID:    this.dataset.grpid,
                    artifactID: this.dataset.artid,
                    version:    this.dataset.version
                });
            });
            console.log('toMerge', libsToMerge);
            this.remoteMergeCmd.execute(libsToMerge, function (err, model) {
                if (err) {
                    console.log('TODO Merge error', err);
                    return;
                }
                
                this.mergeCmd.execute(model);
                this.closeModal.execute();
            }.bind(this));
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenStdLibsModal;
