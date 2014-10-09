var AbstractCommand  = require('../AbstractCommand'),
    LoadFromRegistry = require('../network/LoadFromRegistry'),
    SetModelCmd      = require('../editor/SetModel'),
    CloseModalCmd    = require('../ui/CloseModal'),
    LocalStorage     = require('../../util/LocalStorageHelper'),
    ModelHelper      = require('../../util/ModelHelper'),
    kevoree          = require('kevoree-library').org.kevoree,
    registry         = require('kevoree-registry-client');

var VERS_ALL = 'vers_all',
    VERS_REL = 'vers_rel',
    VERS_LAT = 'vers_lat',
    TYPE_ALL = 'type_all',
    TYPE_NOD = 'type_node',
    TYPE_GRP = 'type_group',
    TYPE_CHA = 'type_chan',
    TYPE_COM = 'type_comp',

    STD_LIB_PKG = 'org.kevoree.library';

/**
 * Created by leiko on 27/01/14.
 */
var OpenListLibsModal = AbstractCommand.extend({
    toString: 'OpenListLibsModal',
    
    execute: function () {
        var loadCmd = new LoadFromRegistry(this.editor);
        var setModelCmd = new SetModelCmd(this.editor);
        var closeModal = new CloseModalCmd(this.editor);

        // set modal view content
        $('#modal-content').html(templates['list-libraries-modal'].render({
            package: LocalStorage.get('list_package', 'foo')
        }));

        var libsListDiv = $('#libs-list'),
            emptyList   = $('#empty-list'),
            allVersBtn  = $('#filter-libs-all'),
            relVersBtn  = $('#filter-libs-release'),
            latVersBtn  = $('#filter-libs-latest'),
            selVersFil  = $('#selected-versions-filter'),
            stdLibsBtn  = $('#std-libs'),
            pkgField    = $('#libs-package'),
            filterField = $('#filter-libs'),
            filterAll   = $('#filter-type-all'),
            filterNode  = $('#filter-type-node'),
            filterGroup = $('#filter-type-group'),
            filterChan  = $('#filter-type-chan'),
            filterComp  = $('#filter-type-comp'),
            selTypeFil  = $('#selected-type-filter'),
            mergeBtn    = $('#merge-libs-btn');

        var baseMergeBtnTxt = mergeBtn.text();

        stdLibsBtn.on('click', function () {
            pkgField.val(STD_LIB_PKG);
            libsListDiv.html(templates['loading-bar'].render({name: STD_LIB_PKG}));
            pkgField.trigger('keyup');
        });

        // ----------- STATE -------------
        var version = VERS_REL;
        var type = TYPE_ALL;
        var nbLibs = 0;
        // ----------- STATE -------------
        function updateView() {
            var libItems = $('.lib-item');

            // reset view to "default"
            libsListDiv.removeClass('hide');
            emptyList.addClass('hide');
            libItems.removeClass('hide');

            switch (version) {
                case VERS_ALL:
                    // show all versions
                    switch (type) {
                        case TYPE_NOD:
                            // but only node types
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_GRP:
                            // but only group types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_CHA:
                            // but only channel types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_COM:
                            // but only component types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            break;
                    }
                    break;

                case VERS_REL:
                    // show release versions
                    libItems.filter('[data-release=false]').addClass('hide');
                    libItems.filter('[data-release=true]').removeClass('hide');
                    switch (type) {
                        case TYPE_NOD:
                            // but only node types
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_GRP:
                            // but only group types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_CHA:
                            console.log('HERE');
                            // but only channel types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_COM:
                            // but only component types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            break;
                    }
                    break;

                case VERS_LAT:
                    // show latest versions
                    libItems.filter('[data-latest=false]').addClass('hide');
                    libItems.filter('[data-latest=true]').removeClass('hide');
                    switch (type) {
                        case TYPE_NOD:
                            // but only node types
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_GRP:
                            // but only group types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_CHA:
                            // but only channel types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=component]').parent().addClass('hide');
                            break;

                        case TYPE_COM:
                            // but only component types
                            libItems.children('.typedef-name[data-tdef=node]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=channel]').parent().addClass('hide');
                            libItems.children('.typedef-name[data-tdef=group]').parent().addClass('hide');
                            break;
                    }
                    break;
            }

            // filter using keyword
            var keyword = filterField.val().toLowerCase();
            if (keyword.length > 0) {
                libItems.filter(':visible').children('.typedef-name').each(function () {
                    if ($(this).text().toLowerCase().search(keyword) === -1) {
                        $(this).parent().addClass('hide');
                    }
                });
            }

            // if no result: show help message
            if (libItems.filter(':visible').size() === 0) {
                libsListDiv.addClass('hide');
                emptyList.removeClass('hide');
            } else {
                libsListDiv.removeClass('hide');
                emptyList.addClass('hide');
            }

            // update merge button
            if (nbLibs > 0) {
                mergeBtn.attr('disabled', false);
                mergeBtn.text(baseMergeBtnTxt+' ('+nbLibs+')');
            } else {
                // disable button
                mergeBtn.attr('disabled', true);
                mergeBtn.text(baseMergeBtnTxt);
            }
        }

        var pkgKeyUpId, pkg, libsModel;
        pkgField.on('keyup', function () {
            clearTimeout(pkgKeyUpId);

            pkgKeyUpId = setTimeout(function () {
                if (pkg !== pkgField.val()) {
                    pkg = pkgField.val();

                    // reset loading div
                    libsListDiv.html(templates['loading-bar'].render({name: pkg}));

                    // load libs
                    loadCmd.execute({fqns: [pkg]}, function (err, libs, model) {
                        libsModel = model;

                        if (err) {
                            libsListDiv.html(templates['loading-bar-error'].render({error: err.message}));
                            console.error(err.stack);
                            // reset old pkg value on error to allow reloads with same name
                            pkg = null;
                            pkgField.val('');
                        } else {
                            libsListDiv.html(templates['libraries-list'].render({
                                libraries: libs,
                                hasLibraries: libs.length > 0
                            })).find('ul').bind('mousedown', function (e) { e.metaKey = true; }).selectable({
                                selected: function () {
                                    nbLibs = $('.lib-item.ui-selected').size();
                                    updateView();
                                },
                                unselected: function () {
                                    nbLibs = $('.lib-item.ui-selected').size();
                                    updateView();
                                }
                            });
                            updateView();
                        }
                    });
                }
            }, 500);
        });

        filterField.on('keyup', function () {
            updateView();
        });

        // add version-filters behavior
        allVersBtn.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                relVersBtn.removeClass('active');
                latVersBtn.removeClass('active');
                selVersFil.html($(this).find('a').text());

                version = VERS_ALL;
                updateView();
            }
        });
        relVersBtn.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                allVersBtn.removeClass('active');
                latVersBtn.removeClass('active');
                selVersFil.html($(this).find('a').text());

                version = VERS_REL;
                updateView();
            }
        });
        latVersBtn.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                relVersBtn.removeClass('active');
                allVersBtn.removeClass('active');
                selVersFil.html($(this).find('a').text());

                version = VERS_LAT;
                updateView();
            }
        });

        filterAll.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                filterNode.removeClass('active');
                filterGroup.removeClass('active');
                filterChan.removeClass('active');
                filterComp.removeClass('active');
                selTypeFil.html($(this).find('a').text());

                type = TYPE_ALL;
                updateView();
            }
        });

        filterNode.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                filterAll.removeClass('active');
                filterGroup.removeClass('active');
                filterChan.removeClass('active');
                filterComp.removeClass('active');
                selTypeFil.html($(this).find('a').text());

                type = TYPE_NOD;
                updateView();
            }
        });

        filterGroup.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                filterAll.removeClass('active');
                filterNode.removeClass('active');
                filterChan.removeClass('active');
                filterComp.removeClass('active');
                selTypeFil.html($(this).find('a').text());

                type = TYPE_GRP;
                updateView();
            }
        });

        filterChan.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                filterAll.removeClass('active');
                filterNode.removeClass('active');
                filterGroup.removeClass('active');
                filterComp.removeClass('active');
                selTypeFil.html($(this).find('a').text());

                type = TYPE_CHA;
                updateView();
            }
        });

        filterComp.on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                filterAll.removeClass('active');
                filterNode.removeClass('active');
                filterChan.removeClass('active');
                filterGroup.removeClass('active');
                selTypeFil.html($(this).find('a').text());

                type = TYPE_COM;
                updateView();
            }
        });

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
                var newModel = factory.createContainerRoot();
                factory.root(newModel);
                compare.merge(newModel, this.editor.getModel()).applyOn(newModel);
                registry.get({fqns: libsToMerge, kevPath: true}, function (err, model) {
                    if (err) {
                        console.error(err.stack);
                        mergeBtn.text(btnText);
                        modalError.html(err.message);
                        modalError.removeClass('hide');
                    } else {
                        var loader = factory.createJSONLoader();
                        model = loader.loadModelFromString(model).get(0);
                        compare.merge(newModel, model).applyOn(newModel);
                        setModelCmd.execute(newModel);
                        closeModal.execute();
                    }
                });

            } catch (err) {
                console.error(err.stack);
                mergeBtn.text(btnText);
                modalError.html(err.message);
                modalError.removeClass('hide');
            }
        }.bind(this));

        $('#modal').modal();
    }
});

module.exports = OpenListLibsModal;
