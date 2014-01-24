var KevWebEditor = require('../../lib/control/KevWebEditor');

$(function () {
  $('#editor').css('top', $('#editor-navbar').outerHeight);

  var editor = new KevWebEditor();
});