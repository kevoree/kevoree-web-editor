var Class = require('pseudoclass'),
    ModelHelper = require('../util/ModelHelper');

/**
 * Created by leiko on 24/01/14.
 */
var UITypeDefinitionList = Class({
    toString: 'UITypeDefinitionList',

    construct: function (/* KevWebEditor */ editor) {
        this.editor = editor;

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
        
        this.nodeToggle  = true;
        this.groupToggle = true;
        this.chanToggle  = true;
        this.compToggle  = true;
        this.keyword    = '';

        this.domListContent.css('top', this.domHeader.outerHeight());

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
        this.domListContent.empty(); // clear content
        var addedTDefs = {};
        var tDefs = this.editor.getModel().typeDefinitions.iterator();
        while (tDefs.hasNext()) {
            var tDef = tDefs.next();
            if (!addedTDefs[tDef.name]) {
                this.domListContent.append(EditorTemplates['typedef-item'].render({
                    name: tDef.name,
                    type: ModelHelper.findTypeDefinitionType(tDef),
                    count: ModelHelper.countInstances(tDef, this.editor.getModel())
                }));
                addedTDefs[tDef.name] = tDef;
            }
        }

        this.domTDefList.find('.type-definition-item').draggable({
            revert: 'invalid',
            appendTo: 'body',
            scroll: false,
            helper: function() {
                var clone = $(this).clone();
                clone.addClass('dragged');
                clone.find('.badge').remove();
                return clone;
            },
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
                this.editor.setDraggedElement(null);
            }.bind(this)
        });

        var domTDefItems = this.domTDefList.find('.type-definition-item');
        domTDefItems.off('dblclick');
        domTDefItems.on('dblclick', function () {
            var tDefName = $(this).find('.typedef-name').html();
            var latestVersion = ModelHelper.findLatestVersion(tDefName, this.editor.getModel());
            var tDef = this.editor.getModel().findTypeDefinitionsByID(tDefName+'/'+latestVersion);
            this.editor.getUI().addInstance(tDef);
        }.bind(this));

        $('.typedef-name').each(function (index, item) {
            var type = $(item).attr('data-tdef');
            if ($(item).text().toLowerCase().search(this.keyword) !== -1) {
                switch (type) {
                    case 'node':
                        if (this.nodeToggle) $(item).parent().show(); 
                        else $(item).parent().hide();
                        break;
                    
                    case 'channel':
                        if (this.chanToggle) $(item).parent().show();
                        else $(item).parent().hide();
                        break;
                    
                    case 'group':
                        if (this.groupToggle) $(item).parent().show();
                        else $(item).parent().hide();
                        break;
                    
                    case 'component':
                        if (this.compToggle) $(item).parent().show();
                        else $(item).parent().hide();
                        break;
                }
            } else  {
                $(item).parent().hide();
            }
        }.bind(this));
    }
});

module.exports = UITypeDefinitionList;