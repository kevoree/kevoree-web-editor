var KevWebEditor     = require('../../lib/engine/KevWebEditor'),
    LoadModelFC      = require('../../lib/command/ui/LoadModelFileChooser'),
    LoadModelDnD     = require('../../lib/command/ui/LoadModelDragNDrop'),
    MergeModel       = require('../../lib/command/ui/MergeModel'),
    SaveModel        = require('../../lib/command/ui/SaveModel'),
    ServerSettings   = require('../../lib/command/ui/ServerSettings'),
    Settings         = require('../../lib/command/ui/Settings'),
    OpenStdLibsModal = require('../../lib/command/ui/OpenStdLibsModal'),
    OpenNodeModal    = require('../../lib/command/ui/OpenFromNodeModal'),
    OpenKevSModal    = require('../../lib/command/ui/OpenKevscriptModal'),
    CloseModal       = require('../../lib/command/ui/CloseModal'),
    Debug            = require('../../lib/command/ui/Debug'),
    Undo             = require('../../lib/command/Undo'),
    Redo             = require('../../lib/command/Redo'),
    SaveModal        = require('../../lib/command/ui/SaveModal'),
    ClearAll         = require('../../lib/command/model/ClearAll'),
    ClearInstances   = require('../../lib/command/model/ClearInstances');

/**
 * Main entry point of Kevoree Web Editor
 */
$(function () {
    // create the editor
    var editor = new KevWebEditor();

    // command invoker
    function executeCmd(Command, param) {
        var cmd = new Command(editor);
        return function (e) {
            cmd.execute.call(cmd, e, param);
        }
    }

    // Menu links listeners
    $('#load').click(executeCmd(LoadModelFC));
    $('#merge').click(executeCmd(MergeModel));
    $('#save-json').click(executeCmd(SaveModel));
    $('#open-from-node').click(executeCmd(OpenNodeModal));
    $('#settings').click(executeCmd(Settings));
    $('#server-settings').click(executeCmd(ServerSettings));
    $('#undo').click(executeCmd(Undo));
    $('#redo').click(executeCmd(Redo));
    $('#clear-all').click(executeCmd(ClearAll));
    $('#clear-instances').click(executeCmd(ClearInstances));
    $('#kev-std-libs').click(executeCmd(OpenStdLibsModal));
    $('#open-kevscript').click(executeCmd(OpenKevSModal));

    // Keyboard shortcuts
    Mousetrap.bind(['command+l', 'ctrl+l'], executeCmd(LoadModelFC));
    Mousetrap.bind(['command+m', 'ctrl+m'], executeCmd(MergeModel));
    Mousetrap.bind(['command+o', 'ctrl+o'], executeCmd(OpenNodeModal));
    Mousetrap.bind(['command+s', 'ctrl+s'], executeCmd(SaveModel));
    Mousetrap.bind(['command+z', 'ctrl+z'], executeCmd(Undo));
    Mousetrap.bind(['command+y', 'ctrl+y'], executeCmd(Redo));
    Mousetrap.bind('alt+s',                 executeCmd(Settings));
    Mousetrap.bind('alt+i',                 executeCmd(ClearInstances));
    Mousetrap.bind('alt+a',                 executeCmd(ClearAll));
    Mousetrap.bind('alt+k',                 executeCmd(OpenStdLibsModal));
    Mousetrap.bind(['command+k', 'ctrl+k'], executeCmd(OpenKevSModal));
    Mousetrap.bind(['command shift alt d', 'ctrl shift alt d'], executeCmd(Debug));
    Mousetrap.bind('up up down down left right left right b a enter', function() {
        console.log("Yeah, you mate know your classics!");
    });
    
    var modal = $('#modal');
    // bind shorcuts "ESC" & "ENTER" when #modal is shown
    modal.on('show.bs.modal', function () {
        Mousetrap.bind('escape', executeCmd(CloseModal));
        Mousetrap.bind('enter', executeCmd(SaveModal));
    });
    // unbind shorcuts "ESC" & "ENTER" when #modal is hidden
    modal.on('hide.bs.modal', function () {
        Mousetrap.unbind('escape');
        Mousetrap.unbind('enter'); 
    });

    // Allow Kevoree model to be loaded from drag'n'drop
    var domEditor = $('#editor');
    domEditor.on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    domEditor.on('drop', executeCmd(LoadModelDnD));
});