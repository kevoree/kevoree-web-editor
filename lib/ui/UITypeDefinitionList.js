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

        this.domListContent.css('top', this.domHeader.outerHeight());

        this.domHideBtn.click(function () {
            this.hide();
        }.bind(this));

        this.domShowBtn.click(function () {
            this.show();
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
    }
});

module.exports = UITypeDefinitionList;