var KevWebEditor = require('../../lib/control/KevWebEditor');
var LoadModel = require('../../lib/command/ui/LoadModel');

$(function () {
  var editor = new KevWebEditor();

  Mousetrap.bind(['command+l', 'ctrl+l'], function () {
    var cmd = new LoadModel();
    cmd.execute(editor);
  });
});