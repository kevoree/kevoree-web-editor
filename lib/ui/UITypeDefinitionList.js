var Class = require('pseudoclass');
var ModelHelper = require('../util/ModelHelper');

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
        var tDefsMap = {};
        while (tDefs.hasNext()) {
            var tDef = tDefs.next();
            this.domListContent.append(EditorTemplates['typedef-item'].render({
                name: tDef.name,
                type: ModelHelper.getTypeDefinitionString(tDef),
                count: 0 // TODO count instance in model
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
            cursor: 'move'
        });
    }
});

module.exports = UITypeDefinitionList;