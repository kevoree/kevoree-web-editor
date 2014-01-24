var KevWebEditor = require('../../lib/control/KevWebEditor');
var LoadModel = require('../../lib/command/ui/LoadModel');
var SaveModel = require('../../lib/command/ui/SaveModel');

$(function () {
    var editor = new KevWebEditor();

    Mousetrap.bind(['command+l', 'ctrl+l'], function () {
        var cmd = new LoadModel();
        cmd.execute(editor);
        return false;
    });

    Mousetrap.bind(['command+s', 'ctrl+s'], function () {
        var cmd = new SaveModel();
        cmd.execute(editor);
        return false;
    });
});