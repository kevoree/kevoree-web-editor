var KevWebEditor     = require('../../lib/engine/KevWebEditor'),
    QueryParser      = require('../../lib/engine/QueryParser'),
    LoadModelFC      = require('../../lib/command/ui/LoadModelFileChooser'),
    LoadModelDnD     = require('../../lib/command/ui/LoadModelDragNDrop'),
    MergeModel       = require('../../lib/command/ui/MergeModel'),
    SaveModel        = require('../../lib/command/ui/SaveModel'),
    SettingsModal    = require('../../lib/command/ui/OpenSettingsModal'),
    ListLibsModal    = require('../../lib/command/ui/OpenListLibsModal'),
    OpenNodeModal    = require('../../lib/command/ui/OpenFromNodeModal'),
    MergeNodeModal   = require('../../lib/command/ui/MergeFromNodeModal'),
    OpenKevSModal    = require('../../lib/command/ui/OpenKevscriptModal'),
    OpenHelpModal    = require('../../lib/command/ui/OpenHelpModal'),
    CloseModal       = require('../../lib/command/ui/CloseModal'),
    Debug            = require('../../lib/command/ui/Debug'),
    SaveModal        = require('../../lib/command/ui/SaveModal'),
    Undo             = require('../../lib/command/editor/Undo'),
    Redo             = require('../../lib/command/editor/Redo'),
    ClearAll         = require('../../lib/command/editor/ClearAll'),
    ClearInstances   = require('../../lib/command/editor/ClearInstances'),
    ClearUnusedTDefs = require('../../lib/command/editor/ClearUnusedTDefs'),
    CustomPushModal  = require('../../lib/command/ui/OpenCustomPushModal'),
    DeleteSelected   = require('../../lib/command/ui/DeleteSelected');

/**
 * Main entry point of Kevoree Web Editor
 */
$(function () {
    // create the editor
    var editor = new KevWebEditor();

    // create the QueryParser
    new QueryParser(editor);

    var modal = $('#modal');

    // command invoker
    function executeCmd(Command, param) {
        var cmd = new Command(editor);
        return function (e) {
            if (Command === SaveModal || Command === CloseModal || !modal.hasClass('in')) {
                cmd.execute.call(cmd, e, param);
            }
        }
    }

    // Menu links listeners
    $('#load').click(executeCmd(LoadModelFC));
    $('#merge').click(executeCmd(MergeModel));
    $('#save-json').click(executeCmd(SaveModel));
    $('#open-from-node').click(executeCmd(OpenNodeModal));
    $('#merge-from-node').click(executeCmd(MergeNodeModal));
    $('#settings').click(executeCmd(SettingsModal));
    $('#undo').click(executeCmd(Undo));
    $('#redo').click(executeCmd(Redo));
    $('#clear-all').click(executeCmd(ClearAll));
    $('#clear-instances').click(executeCmd(ClearInstances));
    $('#clear-unused-tdefs').click(executeCmd(ClearUnusedTDefs));
    $('#kev-libs').click(executeCmd(ListLibsModal));
    $('#open-kevscript').click(executeCmd(OpenKevSModal));
    $('#open-help').click(executeCmd(OpenHelpModal));
    $('#custom-push').click(executeCmd(CustomPushModal));
    $('#delete-selected').click(executeCmd(DeleteSelected));

    // Keyboard shortcuts
    Mousetrap.bind(['command+l', 'ctrl+l'], executeCmd(LoadModelFC));
    Mousetrap.bind(['command+m', 'ctrl+m'], executeCmd(MergeModel));
    Mousetrap.bind(['command+o', 'ctrl+o'], executeCmd(OpenNodeModal));
    Mousetrap.bind(['command+shift+m', 'ctrl+shift+m'], executeCmd(MergeNodeModal));
    Mousetrap.bind(['command+s', 'ctrl+s'], executeCmd(SaveModel));
    Mousetrap.bind(['command+z', 'ctrl+z'], executeCmd(Undo));
    Mousetrap.bind(['command+y', 'ctrl+y'], executeCmd(Redo));
    Mousetrap.bind(['command+y', 'ctrl+y'], executeCmd(Redo));
    Mousetrap.bind(['command+k', 'ctrl+k'], executeCmd(OpenKevSModal));
    Mousetrap.bind(['command+h', 'ctrl+h'], executeCmd(OpenHelpModal));
    Mousetrap.bind(['command shift alt d', 'ctrl shift alt d'], executeCmd(Debug));
    Mousetrap.bind('up up down down left right left right b a enter', function() {
        console.log("Yeah, you mate know your classics!");
    });
    Mousetrap.bind('alt+s', executeCmd(SettingsModal));
    Mousetrap.bind('alt+i', executeCmd(ClearInstances));
    Mousetrap.bind('alt+a', executeCmd(ClearAll));
    Mousetrap.bind('alt+u', executeCmd(ClearUnusedTDefs));
    Mousetrap.bind('del', executeCmd(DeleteSelected));
    Mousetrap.bind('alt+k', executeCmd(ListLibsModal));
    
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