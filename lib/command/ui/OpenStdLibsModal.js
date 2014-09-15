var AbstractCommand = require('../AbstractCommand'),
    LoadStdLibCmd   = require('../network/LoadStdLibraries'),
    MergeLibCmd     = require('../network/MergeLibrary'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    ModelHelper     = require('../../util/ModelHelper'),
    _s              = require('underscore.string'),
    async           = require('async');

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
        function renderList(platform, libraries) {
            $('#' + platform).html(templates['std-libraries-list'].render({
                platform: platform,
                libraries: libraries
            }));
        }

        // set modal view content
        $('#modal-content').html(templates['std-libraries-modal'].render({
            libraries: LIBS.map(function (lib, index) {
                // process std-libraries-modal template data
                var obj = {};
                obj.id = lib;
                if (index === 0) {
                    obj.first = true;
                }
                obj.name = _s.capitalize(lib);
                return obj;
            })
        }));

        var tasks = [];

        // ask remote server for the std libs list
        LIBS.forEach(function (platform) {
            tasks.push(function (cb) {
                this.remoteLoadCmd.execute(platform, function (err, libs) {
                    if (err) {
                        var domLibLoading = $('#' + platform + '-loading');
                        domLibLoading.find('.text').addClass('text-warning').html(err.message);
                        domLibLoading.find('.progress').removeClass('progress-striped active');
                        domLibLoading.find('.progress-bar').addClass('progress-bar-danger').html('Loading failed :/');
                        console.error(err.stack);
                    } else {
                        cb(null, {platform: platform, libs: libs});
                    }
                });
            }.bind(this));
        }.bind(this));

        async.parallel(tasks, function (err, results) {
            /**
             * Filter std-lib-item according to the content of the filter field (#keyword-std-libs-filter)
             */
            function keywordFilter() {
                var keyword = $('#keyword-std-libs-filter').val().toLowerCase();
                $('.std-lib-item .typedef-name').each(function () {
                    if ($(this).text().toLowerCase().search(keyword) !== -1 || $(this).data('tdef') === keyword) {
                        $(this).parent().show();
                    } else {
                        $(this).parent().hide();
                    }
                });
            }

            var allVersBtn = $('#filter-std-libs-all'),
                relVersBtn = $('#filter-std-libs-release'),
                latVersBtn = $('#filter-std-libs-latest'),
                selVersFil = $('#selected-versions-filter');

            // add version-filters behavior
            allVersBtn.on('click', function () {
                if (!$(this).hasClass('active')) {
                    $(this).addClass('active');
                    relVersBtn.removeClass('active');
                    latVersBtn.removeClass('active');
                    selVersFil.html($(this).find('a').text());


                    results.forEach(function (result) {
                        var libraries = [];
                        result.libs.forEach(function (lib) {
                            lib.versions.forEach(function (vers) {
                                libraries.push({
                                    path: lib.path,
                                    version: vers,
                                    type: lib.type,
                                    name: lib.name
                                });
                            });
                        });

                        renderList(result.platform, libraries);
                    });
                }
            });
            relVersBtn.on('click', function () {
                if (!$(this).hasClass('active')) {
                    $(this).addClass('active');
                    allVersBtn.removeClass('active');
                    latVersBtn.removeClass('active');
                    selVersFil.html($(this).find('a').text());

                    results.forEach(function (result) {
                        var libraries = [];
                        result.libs.forEach(function (lib) {
                            if (lib.release) {
                                libraries.push({
                                    path: lib.path,
                                    version: lib.release,
                                    type: lib.type,
                                    name: lib.name
                                });
                            }
                        });

                        renderList(result.platform, libraries);
                    });
                }
            });
            latVersBtn.on('click', function () {
                if (!$(this).hasClass('active')) {
                    $(this).addClass('active');
                    relVersBtn.removeClass('active');
                    allVersBtn.removeClass('active');
                    selVersFil.html($(this).find('a').text());

                    results.forEach(function (result) {
                        var libraries = [];
                        result.libs.forEach(function (lib) {
                            if (lib.latest) {
                                libraries.push({
                                    path: lib.path,
                                    version: lib.latest,
                                    type: lib.type,
                                    name: lib.name
                                });
                            }
                        });

                        renderList(result.platform, libraries);
                    });
                }
            });

            // add filter button behavior
            $('#filter-std-libs').on('click', keywordFilter);

            // add keyup in filter field behavior
            $('#keyword-std-libs-filter').on('keyup', keywordFilter);

            // tick checkbox when item is clicked
            $('.std-lib-item').on('click', function (e) {
                if ($(e.target)[0].localName !== 'input') {
                    var checkbox = $(this).find('input');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    e.stopPropagation();
                }
            });

            results.forEach(function (result) {
                var libraries = [];
                result.libs.forEach(function (lib) {
                    libraries.push({
                        path: lib.path,
                        version: lib.release,
                        type: lib.type,
                        name: lib.name
                    });
                });

                $('#' + result.platform).html(templates['std-libraries-list'].render({
                    platform: result.platform,
                    libraries: libraries
                }));
            });
        });

        var modalSaveBtn = $('#modal-save');
        modalSaveBtn.off('click');
        modalSaveBtn.on('click', function () {
            var libsToMerge = {};
            $('.std-lib-item input:checked').each(function () {
                console.log('checked item', this);
            });

            var modalSaveBtnText = modalSaveBtn.text();
            var modalError = $('#modal-error');
            modalSaveBtn.text('Merging...');
            modalError.addClass('hide');
            this.remoteMergeCmd.execute(libsToMerge, ['https://oss.sonatype.org/content/groups/public'], function (err, model) {
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
