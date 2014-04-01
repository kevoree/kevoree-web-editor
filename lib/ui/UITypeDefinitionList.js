var Class               = require('pseudoclass'),
    ModelHelper         = require('../util/ModelHelper'),
    LoadStdLibraries    = require('../command/network/LoadStdLibraries'),
    AddLibrary          = require('../command/model/AddLibrary'),
    MergeLibrary        = require('../command/network/MergeLibrary'),
    Alert               = require('../util/Alert');

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
        
        this.domLibFold = $('#libs-fold');
        this.domLibUnfold = $('#libs-unfold');

        this.nodeToggle  = true;
        this.groupToggle = true;
        this.chanToggle  = true;
        this.compToggle  = true;
        this.keyword    = '';

        this.domListContent.css('top', this.domHeader.outerHeight());
        this.domListContent.css('height', this.domTDefList.outerHeight() - this.domHeader.outerHeight());

        this.domHideBtn.on('click', function () {
            this.hide();
        }.bind(this));

        this.domShowBtn.on('click', function () {
            this.show();
        }.bind(this));

        function toggleTDefTypeIcons(item) {
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
            toggleTDefTypeIcons(this.domTDefToggleNodes);
            this.nodeToggle = !this.nodeToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleGroups.on('click', function (e) {
            toggleTDefTypeIcons(this.domTDefToggleGroups);
            this.groupToggle = !this.groupToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleChans.on('click', function (e) {
            toggleTDefTypeIcons(this.domTDefToggleChans);
            this.chanToggle = !this.chanToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domTDefToggleComps.on('click', function (e) {
            toggleTDefTypeIcons(this.domTDefToggleComps);
            this.compToggle = !this.compToggle;
            this.update();
            e.preventDefault();
            return false;
        }.bind(this));

        this.domLibFold.on('click', function () {
            var libs = this.editor.getModel().libraries.iterator();
            while (libs.hasNext()) foldLibrary.bind(this)(libs.next());
        }.bind(this));
        
        this.domLibUnfold.on('click', function () {
            var libs = this.editor.getModel().libraries.iterator();
            while (libs.hasNext()) unfoldLibrary.bind(this)(libs.next());
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
    },

    update: function () {
        if (window.innerWidth >= 768) this.domListContent.css('height', this.domTDefList.outerHeight() - this.domHeader.outerHeight());
        else this.domListContent.css('height', 'auto');
        this.domListContent.empty(); // clear content
        var addedTDefs = {};
        
        function addTDefs(tDefs, libName) {
            while (tDefs.hasNext()) {
                var tDef = tDefs.next();
                if (!addedTDefs[tDef.name]) {
                    $('.type-definition-list-group[data-library="'+libName+'"]').append(EditorTemplates['typedef-item'].render({
                        name: tDef.name,
                        type: ModelHelper.findTypeDefinitionType(tDef),
                        count: ModelHelper.countInstances(tDef, this.editor.getModel())
                    }));
                    addedTDefs[tDef.name] = tDef;
                }
            }
        }
        
        var defaultLib = this.editor.getModel().findLibrariesByID('Default');
        if (!defaultLib) {
            defaultLib = this.addLibraryCmd.execute('Default');
            this.editor.getModel().addLibraries(defaultLib);
        }
        var tDefs = this.editor.getModel().typeDefinitions.iterator();
        while (tDefs.hasNext()) {
            var tDef = tDefs.next();
            var hasParentLib = false;
            var libs = this.editor.getModel().libraries.iterator();
            while (libs.hasNext()) {
                var lib = libs.next();
                if (lib.name !== 'Default') {
                    var tdef = lib.findSubTypesByID(tDef.name+'/'+tDef.version);
                    if (tdef) {
                        // this TypeDefinition has a parent library
                        hasParentLib = true;
                        break;
                    }
                }
            }
            if (!hasParentLib) defaultLib.addSubTypes(tDef);
        }

        var libraries = this.editor.getModel().libraries.iterator();
        while (libraries.hasNext()) {
            var lib = libraries.next();
            lib.uiFolded = (typeof (lib.uiFolded) === 'undefined') ? false : lib.uiFolded;
            this.domListContent.append(EditorTemplates['library-group'].render({ name: lib.name }));
            addTDefs.bind(this)(lib.subTypes.iterator(), lib.name);
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
            var tDefName = $(e.currentTarget).find('.typedef-name').text();
            var latestVersion = ModelHelper.findLatestVersion(tDefName, this.editor.getModel());
            var tDef = this.editor.getModel().findTypeDefinitionsByID(tDefName+'/'+latestVersion);
            this.editor.getUI().addInstance(tDef);
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
                        var nodes = this.editor.getModel().nodes.iterator();
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
                    if (window.event.pageY > this.domTDefList.height()) {
                        return isAcceptable.bind(this)();
                    }
                }
                return false;
            }.bind(this),
            drop: function (event, ui) {
                var tDefName = ui.draggable.find('.typedef-name').html(),
                    latestVersion = ModelHelper.findLatestVersion(tDefName, this.editor.getModel()),
                    tDef = this.editor.getModel().findTypeDefinitionsByID(tDefName+'/'+latestVersion),
                    metadata =  {x: event.pageX, y: event.pageY};
                ui.draggable.remove();
                this.editor.getUI().addInstance(tDef, null, metadata);
            }.bind(this)
        });
        
        // remove empty library groups
        var domLibGrps = $('.type-definition-list-group');
        domLibGrps.each(function (index, item) {
            if ($(item).children('.type-definition-item').size() === 0) $(item).remove();
        });
        
        var libItems = $('.library-item');
        libItems.off('click');
        libItems.on('click', function (e) {
            var libName = $(e.currentTarget).children('.library-name').text();
            var lib = this.editor.getModel().findLibrariesByID(libName);
            if (lib.uiFolded) {
                unfoldLibrary.bind(this)(lib);
            } else {
                foldLibrary.bind(this)(lib);
            }
        }.bind(this));

        // go back to previous states if any on updates
        $('.typedef-name').each(function (index, item) {
            var type = $(item).attr('data-tdef');
            if ($(item).text().toLowerCase().search(this.keyword) !== -1) {
                typeToggling.bind(this)($(item).parent(), type);
            } else  {
                $(item).parent().hide();
            }
        }.bind(this));
        
        var libs = this.editor.getModel().libraries.iterator();
        while (libs.hasNext()) {
            var lib = libs.next();
            if (lib.uiFolded) foldLibrary.bind(this)(lib);
        }
    }
});

function typeToggling(item, type) {
    switch (type) {
        case 'node':
            if (this.nodeToggle) $(item).show();
            else $(item).hide();
            break;

        case 'channel':
            if (this.chanToggle) $(item).show();
            else $(item).hide();
            break;

        case 'group':
            if (this.groupToggle) $(item).show();
            else $(item).hide();
            break;

        case 'component':
            if (this.compToggle) $(item).show();
            else $(item).hide();
            break;
    }
}

function foldLibrary(lib) {
    var libGrp = $('.type-definition-list-group[data-library="'+lib.name+'"]');
    var icon = libGrp.children('.library-item').children('.glyphicon');
    icon.removeClass('glyphicon-minus');
    icon.addClass('glyphicon-plus');
    libGrp.children('.type-definition-item').hide();
    lib.uiFolded = true;
}

function unfoldLibrary(lib) {
    var libGrp = $('.type-definition-list-group[data-library="'+lib.name+'"]');
    var icon = libGrp.children('.library-item').children('.glyphicon');
    icon.addClass('glyphicon-minus');
    icon.removeClass('glyphicon-plus');
    libGrp.children('.type-definition-item').each(function (index, item) {
        var type = $(item).children('.typedef-name').attr('data-tdef');
        if ($(item).children('.typedef-name').text().toLowerCase().search(this.keyword) !== -1) {
            typeToggling.bind(this)(item, type);
        } else  {
            $(item).hide();
        }
    }.bind(this));
    lib.uiFolded = false;
}

module.exports = UITypeDefinitionList;