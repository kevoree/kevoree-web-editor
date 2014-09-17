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

        var libsListDiv = $('#libs-list');

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
                            var libraries = [];
                            libs.forEach(function (lib) {
                                lib.versions.forEach(function (vers) {
                                    libraries.push({
                                        path: lib.path,
                                        version: vers,
                                        type: lib.type,
                                        name: lib.name
                                    });
                                });
                            });

                            libsListDiv.html(templates['libraries-list'].render({
                                libraries: libraries,
                                hasLibraries: libraries.length > 0
                            }));

                            // tick checkbox when item is clicked
                            $('.lib-item').off('click').on('click', function (e) {
                                if ($(e.target)[0].localName !== 'input') {
                                    var checkbox = $(this).find('input');
                                    checkbox.prop('checked', !checkbox.prop('checked'));
                                    e.stopPropagation();
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
            $('.lib-item input:checked').each(function () {
                libsToMerge.push($(this).parent().data('path'));
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
