var KevWebEditor = require('../../lib/control/KevWebEditor');
var LoadModel    = require('../../lib/command/ui/LoadModel');
var MergeModel    = require('../../lib/command/ui/MergeModel');
var SaveModel    = require('../../lib/command/ui/SaveModel');
var Settings     = require('../../lib/command/ui/Settings');
var CloseModal   = require('../../lib/command/ui/CloseModal');
var SaveModal    = require('../../lib/command/ui/SaveModal');

$(function () {
    var editor = new KevWebEditor();

    function loadModelCmd(e) {
        var cmd = new LoadModel();
        cmd.execute(editor);
        e.preventDefault();
    }

    function mergeModelCmd(e) {
        var cmd = new MergeModel();
        cmd.execute(editor);
        e.preventDefault();
    }

    function saveModelCmd(e) {
        var cmd = new SaveModel();
        cmd.execute(editor);
        e.preventDefault();
    }

    function openSettings(e) {
        var cmd = new Settings();
        cmd.execute();
        e.preventDefault();
    }

    // Menus links
    $('#load').click(loadModelCmd);
    $('#merge').click(mergeModelCmd);
    $('#save-json').click(saveModelCmd);
    $('#settings').click(openSettings);

    // Keyboard shortcuts
    Mousetrap.bind(['command+l', 'ctrl+l'], loadModelCmd);
    Mousetrap.bind(['command+m', 'ctrl+m'], mergeModelCmd);
    Mousetrap.bind(['command+s', 'ctrl+s'], saveModelCmd);
    Mousetrap.bind(['alt+s', 'alt+s'], openSettings);
    Mousetrap.bind('escape', function (e) {
        var cmd = new CloseModal();
        cmd.execute();
        e.preventDefault();
    });
    Mousetrap.bind('enter', function (e) {
        var cmd = new SaveModal();
        cmd.execute();
        e.preventDefault();
    });
    Mousetrap.bind('up up down down left right left right b a enter', function() {
        console.log("Yeah, you mate know your classics!");
    });
});