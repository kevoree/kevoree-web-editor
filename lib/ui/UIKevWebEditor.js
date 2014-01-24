/**
 * Created by leiko on 23/01/14.
 */
var Class = require('pseudoclass');
var ConfImg = require('../config/images');
var UITypeDefinitionList = require('./UITypeDefinitionList');

var UIKevWebEditor = Class({
  toString: 'UIKevWebEditor',

  construct: function () {
    var domEditor = $('#editor');
    domEditor.css('top', $('#editor-navbar').outerHeight);

    this.stage = new Kinetic.Stage({
      container: 'editor',
      width: domEditor.width(),
      height: domEditor.height()
    });

    var bgLayer = new Kinetic.Layer();

    var bgImg = new Image();
    bgImg.onload = function() {
      var background = new Kinetic.Image({
        image: bgImg
      });
      background.cache();
      bgLayer.add(background);
      bgLayer.setZIndex(0);
      bgLayer.draw();
    }

    this.stage.add(bgLayer);
    bgImg.src = ConfImg.background;

    this.resizeId = null;
    $(window).on('resize', function () {
      // but do it not each time "resize" event occurs because it would be very laggy
      // so use a little setTimeout and do the resize only if no resize events occured since 100ms
      clearTimeout(this.resizeId);
      this.resizeId = setTimeout(function () {
        this.stage.width(domEditor.width());
        this.stage.height(domEditor.height());
        this.stage.draw();
      }.bind(this), 100);
    }.bind(this));

    domEditor.droppable({
      accept: function (draggedItem) {
        if (draggedItem.hasClass('type-definition-item')) {
          console.log('TODO DROPPABLE ACCEPT METHOD');
          // return true when you can drop the item
        }
        return false;
      },
      drop: function (event, ui) {
        console.log('TODO DROP');
      }
    });

    console.log('UIKevWebEditor stage constructed');

    this.uiTDefList = new UITypeDefinitionList();
  }
});

module.exports = UIKevWebEditor;