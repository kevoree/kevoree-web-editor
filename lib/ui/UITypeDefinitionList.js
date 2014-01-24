var Class = require('pseudoclass');

/**
 * Created by leiko on 24/01/14.
 */
var UITypeDefinitionList = Class({
  toString: 'UITypeDefinitionList',

  construct: function () {
    this.domTDefList     = $('#type-definition-list');
    this.domPanelHeading = this.domTDefList.find('.panel-heading');
    this.domListGrp      = this.domTDefList.find('.list-group');
    this.domTDefHideBtn  = $('#type-definition-list-hide-btn');
    this.domTDefShowBtn  = $('#type-definition-list-show-btn');

    this.domListGrp.css('top', this.domPanelHeading.outerHeight());

    this.domTDefHideBtn.click(function () {
      this.hide();
    }.bind(this));

    this.domTDefShowBtn.click(function () {
      this.show();
    }.bind(this));

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
  },

  hide: function () {
    this.domTDefList.addClass('hide');
    this.domTDefShowBtn.removeClass('hide');
  },

  show: function () {
    this.domTDefList.removeClass('hide');
    this.domTDefShowBtn.addClass('hide');
  }
});

module.exports = UITypeDefinitionList;