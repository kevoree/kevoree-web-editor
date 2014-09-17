var AbstractCommand = require('../AbstractCommand'),
    LoadFromRegistry= require('../network/LoadFromRegistry'),
    MergeModelCmd   = require('../editor/MergeModel'),
    CloseModalCmd   = require('../ui/CloseModal'),
    LocalStorage    = require('../../util/LocalStorageHelper'),
    ModelHelper     = require('../../util/ModelHelper'),
    kevoree         = require('kevoree-library').org.kevoree,
    registry        = require('kevoree-registry-client'),
    async           = require('async');

/**
 * Created by leiko on 27/01/14.
 */
var OpenListLibsModal = AbstractCommand.extend({
    toString: 'OpenListLibsModal',
    
    execute: function () {
        var loadCmd = new LoadFromRegistry(this.editor);
        var mergeCmd = new MergeModelCmd(this.editor);
        var closeModal = new CloseModalCmd(this.editor);

        // set modal view content
        $('#modal-content').html(templates['list-libraries-modal'].render({
            package: LocalStorage.get('list_package', 'foo')
        }));

        var libsListDiv = $('#libs-list'),
            allVersBtn  = $('#filter-std-libs-all'),
            relVersBtn  = $('#filter-std-libs-release'),
            latVersBtn  = $('#filter-std-libs-latest'),
            selVersFil  = $('#selected-versions-filter');

        var keyUpId, pkg, libsModel;
        $('#libs-package').on('keyup', function () {
            clearTimeout(keyUpId);

            keyUpId = setTimeout(function () {
                if (pkg !== $(this).val()) {
                    pkg = $(this).val();

                    // reset loading div
                    libsListDiv.html(templates['loading-bar'].render({name: pkg}));

                    // load libs
                    loadCmd.execute(pkg, function (err, libs, model) {
                        libsModel = model;

                        if (err) {
                            libsListDiv.html(templates['loading-bar-error'].render({error: err.message}));
                            console.error(err.stack);
                        } else {
                            libsListDiv.html(templates['libraries-list'].render({
                                libraries: libs,
                                hasLibraries: libs.length > 0
                            })).find('ul').bind('mousedown', function (e) { e.metaKey = true; }).selectable();

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
                        }
                    });
                }
            }.bind(this), 500);
        });

        var mergeBtn = $('#merge-libs-btn');
        mergeBtn.off('click').one('click', function () {
            var libsToMerge = [];
            $('.lib-item.ui-selected').each(function () {
                libsToMerge.push($(this).data('path'));
            });

            var btnText = mergeBtn.text();
            var modalError = $('#modal-error');
            mergeBtn.text('Merging...');
            modalError.addClass('hide');

            try {
                var factory = new kevoree.factory.DefaultKevoreeFactory();
                var compare = factory.createModelCompare();
                var toMerge = factory.createContainerRoot();
                factory.root(toMerge);
                var mergeTasks = [];
                libsToMerge.forEach(function (path) {
                    mergeTasks.push(function (cb) {
                        var tdef = libsModel.findByPath(path);
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
                        mergeCmd.execute(toMerge);
                        closeModal.execute();
                    }
                });

            } catch (err) {
                console.error(err.stack);
                mergeBtn.text(btnText);
                modalError.html(err.message);
                modalError.removeClass('hide');
            }
        });

        $('#modal').modal();
    }
});

module.exports = OpenListLibsModal;
