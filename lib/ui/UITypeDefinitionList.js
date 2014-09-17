var Class               = require('pseudoclass'),
    ModelHelper         = require('../util/ModelHelper'),
    AddLibrary          = require('../command/model/AddLibrary'),
    Alert               = require('../util/Alert'),
    semver              = require('semver');

var DEFAULT_LIB = 'Default';

/**
 * Created by leiko on 24/01/14.
 */
var UITypeDefinitionList = Class({
    toString: 'UITypeDefinitionList',

    construct: function (/* KevWebEditor */ editor) {
        this.editor = editor;
        this.addLibraryCmd = new AddLibrary(editor);

        this.domTDefList    = $('#type-definition-list');
        this.domHeader      = this.domTDefList.find('.panel-heading');
        this.domListContent = $('#type-definition-list-content');
        this.domHideBtn     = $('#type-definition-list-hide-btn');
        this.domShowBtn     = $('#type-definition-list-show-btn');
        this.domTDefSearch  = $('#tdef-search');

        this.domTDefToggleNodes  = $('#tdef-toggle-nodes');
        this.domTDefToggleGroups = $('#tdef-toggle-groups');
        this.domTDefToggleChans  = $('#tdef-toggle-chans');
        this.domTDefToggleComps  = $('#tdef-toggle-comps');

        this.domPkgFold = $('#pkgs-fold');
        this.domPkgUnfold = $('#pkgs-unfold');

        this.tdefNodeToggle  = true;
        this.tdefGroupToggle = true;
        this.tdefChanToggle  = true;
        this.tdefCompToggle  = true;

        this.keyword    = '';

        this.domListContent.css('top', this.domHeader.outerHeight());
        this.domListContent.css('height', this.domTDefList.outerHeight() - this.domHeader.outerHeight());

        this.domHideBtn.on('click', function () {
            this.hide();
        }.bind(this));

        this.domShowBtn.on('click', function () {
            this.show();
        }.bind(this));

        function toggleEyeIcon(item) {
            var icon = item.find('span');
            if (icon.hasClass('glyphicon-eye-open')) {
                icon.removeClass('glyphicon-eye-open');
                icon.addClass('glyphicon-eye-close');
            } else {
                icon.addClass('glyphicon-eye-open');
                icon.removeClass('glyphicon-eye-close');
            }
        }

        this.domTDefToggleNodes.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.tdefNodeToggle = !this.tdefNodeToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleGroups.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.tdefGroupToggle = !this.tdefGroupToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleChans.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.tdefChanToggle = !this.tdefChanToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleComps.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.tdefCompToggle = !this.tdefCompToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domPkgFold.on('click', function () {
            ModelHelper.walkPackageTree(this.editor.getModel(), foldPackage.bind(this));
        }.bind(this));

        this.domPkgUnfold.on('click', function () {
            ModelHelper.walkPackageTree(this.editor.getModel(), unfoldPackage.bind(this));
        }.bind(this));

        this.domTDefSearch.on('keyup', function () {
            this.keyword = this.domTDefSearch.val().toLowerCase();
            this.update();
        }.bind(this));
    },

    hide: function () {
        this.domTDefList.addClass('hide');
        this.domShowBtn.removeClass('hide');
    },

    show: function () {
        this.domTDefList.removeClass('hide');
        this.domShowBtn.addClass('hide');
        this.update();
    },

    update: function () {
        var model = this.editor.getModel();

        // resize tree
        if (window.innerWidth >= 768) {
            this.domListContent.css('height', this.domTDefList.outerHeight() - this.domHeader.outerHeight());
        } else {
            this.domListContent.css('height', 'auto');
        }

        // clear content
        this.domListContent.empty();

        var tdefList = {};

        ModelHelper.walkPackageTree(model, function (pkg) {
            var pkgFQN = ModelHelper.getFQN(pkg);

            // append UI for Package
            this.domListContent.append(templates['package-group'].render({
                name:   pkg.name,
                fqn:    pkgFQN
            }));

            // by default, package ui is in "unfolded" state
            pkg.uiFolded = false;

            var tdefs = pkg.typeDefinitions.iterator();
            while (tdefs.hasNext()) {
                var tdef = tdefs.next();
                var tdefFQN = ModelHelper.getFQN(tdef);
                // do not duplicate TypeDefinition (1 item for n versions)
                tdefList[tdefFQN] = {
                    pkgFQN: pkgFQN,
                    fqn:    tdefFQN,
                    name:   tdef.name,
                    type:   ModelHelper.findTypeDefinitionType(tdef),
                    count:  ModelHelper.countInstances(tdef, model)
                };
            }
        }.bind(this));

        for (var fqn in tdefList) {
            // append UI for TypeDefinition
            if (tdefList.hasOwnProperty(fqn)) {
                $('.package-item[data-fqn="'+tdefList[fqn].pkgFQN+'"]')
                    .parent()
                    .append(templates['typedef-item'].render(tdefList[fqn]));
            }
        }

        var domTDefItems = $('.type-definition-item');
        domTDefItems.draggable({
            revert: 'invalid',
            appendTo: 'body',
            addClasses: false,
            scroll: false,
            helper: function() {
                var clone = $(this).clone();
                clone.addClass('dragged');
                clone.find('.badge').remove();
                clone.find('.typedef-name').css('display', 'table');
                return clone;
            },
            cursor: 'move',
            cursorAt: {
                top: -5, // offset mouse cursor over the dragged item
                right: -5 // dragged item will be place to the left of cursor (ergo++ on mobile devices)
            },
            start: function (event, ui) {
                var domTDefName = ui.helper.find('.typedef-name');
                this.editor.setDraggedElement({
                    name: domTDefName.html(),
                    type: domTDefName.attr('data-tdef'),
                    typeDef: true
                });
            }.bind(this),
            stop: function () {
                document.body.style.cursor = 'default';
                this.editor.setDraggedElement(null);
            }.bind(this)
        });

        domTDefItems.off('dblclick');
        domTDefItems.on('dblclick', function (e) {
            var tdefFQN = $(e.currentTarget).find('.typedef-name').data('fqn');
            var tdefs = ModelHelper.findTypeDefinitionsByFQN(tdefFQN, model);
            var tdef = tdefs.get(0);
            tdefs = tdefs.iterator();
            while (tdefs.hasNext()) {
                var t = tdefs.next();
                if (semver.gt(t.version, tdef.version)) {
                    tdef = t;
                }
            }
            this.editor.getUI().addInstance(tdef);
        }.bind(this));

        $('#editor').droppable({
            accept: function (ui) {
                function isAcceptable() {
                    var item = ui.find('.typedef-name');
                    var type = item.attr('data-tdef');
                    if (type === 'component') {
                        var editorOffset = $('#editor').offset();
                        var mousePos = {
                            x: window.event.x - editorOffset.left,
                            y: window.event.y - editorOffset.top
                        };
                        var nodes = model.nodes.iterator();
                        while (nodes.hasNext()) {
                            var node = nodes.next();
                            if (node.ui.contains(mousePos)) {
                                return true;
                            }
                        }

                        var alert = new Alert();
                        alert.setType('warning');
                        alert.setText('Unable to add component', 'Components must be dropped into node instances');
                        alert.show(10000);
                        return false;
                    }

                    return true;
                }

                if (window.innerWidth >= 768) {
                    if (window.event.pageX > this.domTDefList.width()) {
                        return isAcceptable.bind(this)();
                    }
                } else {
                    return window.event.pageY > this.domTDefList.height();
                }
                return false;
            }.bind(this),
            drop: function (event, ui) {
                var domTdef = ui.draggable.find('.typedef-name'),
                    metadata =  {x: event.pageX, y: event.pageY};

                var tdefs = ModelHelper.findTypeDefinitionsByFQN(domTdef.data('fqn'), model);
                var tdef = tdefs.get(0);
                tdefs = tdefs.iterator();
                while (tdefs.hasNext()) {
                    var t = tdefs.next();
                    if (semver.gt(t.version, tdef.version)) {
                        tdef = t;
                    }
                }

                if (domTdef.data('tdef') && domTdef.data('tdef') === 'node') {
                    var editorOffset = $('#editor').offset();
                    metadata.x -= editorOffset.left;
                    metadata.y -= editorOffset.top;
                }

                ui.draggable.remove();
                this.editor.getUI().addInstance(tdef, null, metadata);
            }.bind(this)
        });

        var packageItems = $('.package-item');
        packageItems.off('click');
        packageItems.on('click', function (e) {
            var fqn = $(e.currentTarget).data('fqn');
            var pkg = ModelHelper.findPackageByFQN(fqn, model);
            if (pkg.uiFolded) {
                unfoldPackage.bind(this)(pkg);
            } else {
                foldPackage.bind(this)(pkg);
            }
        }.bind(this));

        // go back to previous states if any on updates
//        $('.typedef-name').each(function (index, item) {
//            var type = $(item).attr('data-tdef');
//            if ($(item).text().toLowerCase().search(this.keyword) !== -1) {
//                typeToggling.bind(this)($(item).parent(), type);
//            } else  {
//                $(item).parent().hide();
//            }
//        }.bind(this));

//        libs = this.editor.getModel().libraries.iterator();
//        while (libs.hasNext()) {
//            lib = libs.next();
//            if (lib.uiFolded) foldPackage.bind(this)(lib);
//        }
    }
});

function typeToggling(item, type) {
    switch (type) {
        case 'node':
            if (this.tdefNodeToggle) $(item).show();
            else $(item).hide();
            break;

        case 'channel':
            if (this.tdefChanToggle) $(item).show();
            else $(item).hide();
            break;

        case 'group':
            if (this.tdefGroupToggle) $(item).show();
            else $(item).hide();
            break;

        case 'component':
            if (this.tdefCompToggle) $(item).show();
            else $(item).hide();
            break;
    }
}

function foldPackage(pkg) {
    var pkgGrp = $('.package-item[data-fqn="'+ModelHelper.getFQN(pkg)+'"]').parent();
    var icon = pkgGrp.children('.package-item').children('.glyphicon');
    icon.removeClass('glyphicon-minus');
    icon.addClass('glyphicon-plus');
    pkgGrp.children('.type-definition-item').hide();
    pkg.uiFolded = true;
}

function unfoldPackage(pkg) {
    var pkgGrp = $('.package-item[data-fqn="'+ModelHelper.getFQN(pkg)+'"]').parent();
    var icon = pkgGrp.children('.package-item').children('.glyphicon');
    icon.addClass('glyphicon-minus');
    icon.removeClass('glyphicon-plus');
    pkgGrp.children('.type-definition-item').each(function (index, item) {
        var type = $(item).children('.typedef-name').attr('data-tdef');
        if ($(item).children('.typedef-name').text().toLowerCase().search(this.keyword) !== -1) {
            typeToggling.bind(this)(item, type);
        } else  {
            $(item).hide();
        }
    }.bind(this));
    pkg.uiFolded = false;
}

module.exports = UITypeDefinitionList;