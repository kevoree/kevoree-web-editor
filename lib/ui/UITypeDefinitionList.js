var Class = require('pseudoclass');
var ModelHelper = require('../util/ModelHelper');
var AddInstance = require('../command/model/AddInstance');

/**
 * Created by leiko on 24/01/14.
 */
var UITypeDefinitionList = Class({
    toString: 'UITypeDefinitionList',

    construct: function (/* KevWebEditor */ ctrl) {
        this.ctrl = ctrl;

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
        var tDefs = this.ctrl.getModel().typeDefinitions.iterator();
        while (tDefs.hasNext()) {
            var tDef = tDefs.next();
            this.domListContent.append(EditorTemplates['typedef-item'].render({
                name: tDef.name,
                type: ModelHelper.getTypeDefinitionString(tDef),
                count: ModelHelper.countInstances(tDef, this.ctrl.getModel())
            }));
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
                this.ctrl.setDraggedElement({
                    name: domTDefName.html(),
                    type: domTDefName.attr('data-tdef'),
                    typeDef: true
                })
            }.bind(this),
            stop: function () {
                this.ctrl.setDraggedElement(null);
            }.bind(this)
        });

        var addInstanceCmd = new AddInstance();
        var ctrl = this.ctrl;
        this.domTDefList.find('.type-definition-item').on('dblclick', function () {
            var tDefName = $(this).find('.typedef-name').html();
            addInstanceCmd.execute(null, tDefName, ModelHelper.findLatestVersion(tDefName, ctrl.getModel()), ctrl);
        });
    }
});

module.exports = UITypeDefinitionList;