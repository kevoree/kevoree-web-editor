var AbstractCommand = require('../AbstractCommand'),
    LoadFromRegistry= require('../network/LoadFromRegistry'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    ModelHelper     = require('../../util/ModelHelper'),
    SemverParser    = require('../../util/SemverParser'),
    kevoree         = require('kevoree-library').org.kevoree,
    registry        = require('kevoree-registry-client'),
    _s              = require('underscore.string'),
    async           = require('async');

var LIBS = ['java', 'javascript', 'cloud'];

/**
 * Created by leiko on 27/01/14.
 */
var OpenStdLibsModal = AbstractCommand.extend({
    toString: 'OpenStdLibsModal',

    construct: function (editor) {
        this.remoteLoadCmd = new LoadFromRegistry(editor);
        this.mergeCmd = new MergeModelCmd(editor);
        this.closeModal = new CloseModalCmd(editor);
    },

    execute: function () {
        var modal = $('#modal');

        /**
         * Filter std-lib-item according to the content of the filter field (#keyword-std-libs-filter)
         */
        function keywordFilter() {
            var keyword = $('#keyword-std-libs-filter').val().toLowerCase();
            $('.lib-item .typedef-name').each(function () {
                if ($(this).text().toLowerCase().search(keyword) !== -1 || $(this).data('tdef') === keyword) {
                    $(this).parent().show();
                } else {
                    $(this).parent().hide();
                }
            });
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

        modal.off('shown.bs.modal').one('shown.bs.modal', function loadContent() {
            //modal.off('show.bs.modal').on('show.bs.modal', loadContent.bind(this)); // reload content when re-displaying modal (using shortcut)

            var tasks = [];
            var factory = new kevoree.factory.DefaultKevoreeFactory();
            var compare = factory.createModelCompare();

            var stdLibsModel = factory.createContainerRoot();
            factory.root(stdLibsModel);

                // ask remote server for the std libs list
            LIBS.forEach(function (platform) {
                tasks.push(function (cb) {
                    var fqn = 'org.kevoree.library.';
                    if (platform === 'javascript') { fqn += 'js'; }
                    else { fqn += platform }
                    this.remoteLoadCmd.execute(fqn, function (err, libraries, model) {
                        if (err) {
                            var domLibLoading = $('#' + platform + '-loading');
                            domLibLoading.find('.text').addClass('text-warning').html(err.message);
                            domLibLoading.find('.progress').removeClass('progress-striped active');
                            domLibLoading.find('.progress-bar').addClass('progress-bar-danger').html('Loading failed :/');
                            console.error(err.stack);
                        } else {
                            var mergeSeq = compare.merge(stdLibsModel, model);
                            mergeSeq.applyOn(stdLibsModel);

                            cb(null, {platform: platform, libraries: libraries});
                        }
                    });
                }.bind(this));
            }.bind(this));

            async.parallel(tasks, function (err, results) {
                // render 'release' versions of libraries
                results.forEach(function (result) {
                    // render libraries list in DOM
                    $('#' + result.platform).html(templates['libraries-list'].render({
                        libraries: result.libraries,
                        hasLibraries: result.libraries.length > 0
                    })).find('ul').bind('mousedown', function (e) { e.metaKey = true; }).selectable();
                });

                // by default: only show release versions
                $('.lib-item[data-release=false]').addClass('hide');
                $('.lib-item[data-release=true]').removeClass('hide');

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

                        $('.lib-item').removeClass('hide');
                    }
                });
                relVersBtn.on('click', function () {
                    if (!$(this).hasClass('active')) {
                        $(this).addClass('active');
                        allVersBtn.removeClass('active');
                        latVersBtn.removeClass('active');
                        selVersFil.html($(this).find('a').text());

                        $('.lib-item[data-release=false]').addClass('hide');
                        $('.lib-item[data-release=true]').removeClass('hide');
                    }
                });
                latVersBtn.on('click', function () {
                    if (!$(this).hasClass('active')) {
                        $(this).addClass('active');
                        relVersBtn.removeClass('active');
                        allVersBtn.removeClass('active');
                        selVersFil.html($(this).find('a').text());

                        $('.lib-item[data-latest=false]').addClass('hide');
                        $('.lib-item[data-latest=true]').removeClass('hide');
                    }
                });

                // add filter button behavior
                $('#filter-std-libs').on('click', keywordFilter);

                // add keyup in filter field behavior
                $('#keyword-std-libs-filter').on('keyup', keywordFilter);
            });

            var mergeBtn = $('#modal-save');
            mergeBtn.off('click');
            mergeBtn.on('click', function () {
                var libsToMerge = [];
                $('.lib-item.ui-selected').each(function () {
                    libsToMerge.push($(this).data('path'));
                });

                var btnText = mergeBtn.text();
                var modalError = $('#modal-error');
                mergeBtn.text('Merging...');
                modalError.addClass('hide');

                try {
                    var toMerge = factory.createContainerRoot();
                    factory.root(toMerge);
                    var mergeTasks = [];
                    libsToMerge.forEach(function (path) {
                        mergeTasks.push(function (cb) {
                            var tdef = stdLibsModel.findByPath(path);
                            registry.get({fqn: ModelHelper.getFQN(tdef), version: tdef.version}, function (err, model) {
                                if (err) {
                                    cb(err);
                                } else {
                                    var loader = factory.createJSONLoader();
                                    model = loader.loadModelFromString(model).get(0);
                                    compare.merge(toMerge, model).applyOn(toMerge);
                                    cb();
                                }
                            });
                        });
                    });
                    async.series(mergeTasks, function (err) {
                        if (err) {
                            console.error(err.stack);
                            mergeBtn.text(btnText);
                            modalError.html(err.message);
                            modalError.removeClass('hide');
                        } else {
                            this.mergeCmd.execute(toMerge);
                            this.closeModal.execute();
                        }
                    }.bind(this));

                } catch (err) {
                    console.error(err.stack);
                    mergeBtn.text(btnText);
                    modalError.html(err.message);
                    modalError.removeClass('hide');
                }
            }.bind(this));
        }.bind(this));

        modal.modal();
    }
});

module.exports = OpenStdLibsModal;
