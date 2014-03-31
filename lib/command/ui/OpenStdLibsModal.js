var AbstractCommand = require('../AbstractCommand'),
    LoadStdLibCmd   = require('../network/LoadStdLibraries'),
    MergeLibCmd     = require('../network/MergeLibrary'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    LSKeys          = require('../../config/local-storage-keys'),
    DefaultConf     = require('../../config/defaults'),
    _s              = require('underscore.string');

var LIBS = ['java', 'javascript', 'cloud'];

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
        // process std-libraries-modal template data
        var libraries = LIBS.map(function (lib, index) {
            var obj = {};
            if (index == 0) obj.first = true;
            obj.name = _s.capitalize(lib);
            return obj;
        });

        // retrieve remote server settings

        // set modal view content
        $('#modal-content').html(EditorTemplates['std-libraries-modal'].render({
            host:       LocalStorage.get(LSKeys.HOST) || DefaultConf.HOST,
            port:       LocalStorage.get(LSKeys.PORT) || DefaultConf.PORT,
            libraries:  libraries
        }));
        
        var loadedLibs = {};

        // ask remote server for the std libs list
        for (var i in libraries) {
            (function (platform) {
                // retrieve "lib" from remote server
                this.remoteLoadCmd.execute(platform.toLowerCase(), function (err, libs) {
                    var domLibLoading = $('#'+platform+'-loading');
                    if (err) {
                        domLibLoading.find('.text').addClass('text-warning').html(err.message);
                        domLibLoading.find('.progress').removeClass('progress-striped active');
                        domLibLoading.find('.progress-bar').addClass('progress-bar-danger').html('Loading failed :/');
                        return;
                    }

                    // successfully retrieved lib list for platform
                    loadedLibs[platform] = libs;
                    domLibLoading.find('.progress').removeClass('progress-striped active');
                    domLibLoading.find('.progress-bar').addClass('progress-bar-success').html('Loaded successfully');
                    setTimeout(function () {
                        function displayList(platform) {
                            var libVers = [];
                            for (var i in loadedLibs[platform]) {
                                for (var j in loadedLibs[platform][i].versions) {
                                    libVers.push({
                                        groupID:    loadedLibs[platform][i].groupID,
                                        artifactID: loadedLibs[platform][i].artifactID,
                                        name:       loadedLibs[platform][i].simpleName,
                                        version:    loadedLibs[platform][i].versions[j],
                                        type:       loadedLibs[platform][i].type,
                                        show:       (function () {
                                                        if ($('#filter-std-libs-latest').hasClass('active')) {
                                                            return (loadedLibs[platform][i].versions[j] === loadedLibs[platform][i].latest);
                                                        }
                                                        return true;
                                                    })()
                                    });
                                }
                            }
                            $('#'+platform).html(EditorTemplates['std-libraries-list'].render({
                                platform: platform.toLowerCase(),
                                libraries: libVers
                            }));
                            keywordFilter();
                        }
                        displayList(platform);

                        function keywordFilter() {
                            var keyword = $('#keyword-std-libs-filter').val().toLowerCase();
                            $('.std-lib-item .typedef-name').each(function () {
                                if ($(this).text().toLowerCase().search(keyword) !== -1 || this.dataset.tdef.toLowerCase().search(keyword) !== -1) {
                                    $(this).parent().show();
                                } else {
                                    $(this).parent().hide();
                                }
                            });
                        }
                        $('#filter-std-libs').off('click');
                        $('#filter-std-libs').on('click', keywordFilter);
                        $('#keyword-std-libs-filter').off('keyup');
                        $('#keyword-std-libs-filter').on('keyup', keywordFilter);

                        $('#filter-std-libs-latest').off('click');
                        $('#filter-std-libs-latest').on('click', function (e) {
                            if (!$(this).hasClass('active')) {
                                $(this).addClass('active');
                                $('#filter-std-libs-all').removeClass('active');
                                $('.std-platform-tab').each(function () {
                                    displayList($(this).text());
                                });
                            }
                            e.preventDefault();
                            return false;
                        });

                        $('#filter-std-libs-all').off('click');
                        $('#filter-std-libs-all').on('click', function (e) {
                            if (!$(this).hasClass('active')) {
                                $(this).addClass('active');
                                $('#filter-std-libs-latest').removeClass('active');
                                $('.std-platform-tab').each(function () {
                                    displayList($(this).text());
                                });
                            }
                            e.preventDefault();
                            return false;
                        });
                        
                        $('.std-lib-item').off('click');
                        $('.std-lib-item').on('click', function (e) {
                            var checkbox = $(e.target).find('input');
                            if (checkbox.length > 0) {
                                checkbox.prop('checked', !checkbox.prop('checked'));
                                e.stopPropagation();
                            }
                        });
                    }.bind(this), 1000);
                }.bind(this));
            }.bind(this))(libraries[i].name);
        }

        var modalSaveBtn = $('#modal-save');
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {
            var libsToMerge = {};
            $('.std-lib-item input:checked').each(function () {
                libsToMerge[this.parentElement.parentElement.dataset.platform] =
                    libsToMerge[this.parentElement.parentElement.dataset.platform] || [];
                libsToMerge[this.parentElement.parentElement.dataset.platform].push({
                    groupID:    this.dataset.grpid,
                    artifactID: this.dataset.artid,
                    version:    this.dataset.version
                });
            });
            
            var modalSaveBtnText = modalSaveBtn.text();
            var modalError = $('#modal-error');
            modalSaveBtn.text('Merging...');
            modalError.addClass('hide');
            this.remoteMergeCmd.execute(libsToMerge, ['http://oss.sonatype.org/content/groups/public'], function (err, model) {
                if (err) {
                    console.log('TODO Merge error', err);
                    modalSaveBtn.text(modalSaveBtnText);
                    modalError.html(err.message);
                    modalError.removeClass('hide');
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
