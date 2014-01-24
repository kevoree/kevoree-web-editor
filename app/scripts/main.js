var KevWebEditor = require('../../lib/control/KevWebEditor');
var LoadModel = require('../../lib/command/ui/LoadModel');
var SaveModel = require('../../lib/command/ui/SaveModel');

$(function () {
    var editor = new KevWebEditor();
    function loadModelCmd() {
        var cmd = new LoadModel();
        cmd.execute(editor);
        return false;
    }

    function saveModelCmd() {
        var cmd = new SaveModel();
        cmd.execute(editor);
        return false;
    }

    // Menus links
    $('#load').click(loadModelCmd);
    $('#save-json').click(saveModelCmd);

    // Keyboard shortcuts
    Mousetrap.bind(['command+l', 'ctrl+l'], loadModelCmd);
    Mousetrap.bind(['command+s', 'ctrl+s'], saveModelCmd);
});