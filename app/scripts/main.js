var KevWebEditor = require('../../lib/engine/KevWebEditor'),
    LoadModel    = require('../../lib/command/ui/LoadModel'),
    MergeModel   = require('../../lib/command/ui/MergeModel'),
    SaveModel    = require('../../lib/command/ui/SaveModel'),
    Settings     = require('../../lib/command/ui/Settings'),
    CloseModal   = require('../../lib/command/ui/CloseModal'),
    Debug        = require('../../lib/command/ui/Debug'),
    Undo         = require('../../lib/command/Undo'),
    Redo         = require('../../lib/command/Redo'),
    SaveModal    = require('../../lib/command/ui/SaveModal');

$(function () {
    var editor = new KevWebEditor();

    function executeCmd(Command, param) {
        return function (e) {
            var cmd = new Command(editor);
            cmd.execute(param);
            e.preventDefault();
        }
    }

    // Menus links
    $('#load').click(executeCmd(LoadModel));
    $('#merge').click(executeCmd(MergeModel));
    $('#save-json').click(executeCmd(SaveModel));
    $('#settings').click(executeCmd(Settings));
    $('#undo').click(executeCmd(Undo));
    $('#redo').click(executeCmd(Redo));

    // Keyboard shortcuts
    Mousetrap.bind(['command+l', 'ctrl+l'], executeCmd(LoadModel));
    Mousetrap.bind(['command+m', 'ctrl+m'], executeCmd(MergeModel));
    Mousetrap.bind(['command+s', 'ctrl+s'], executeCmd(SaveModel));
    Mousetrap.bind(['command+z', 'ctrl+z'], executeCmd(Undo));
    Mousetrap.bind(['command+y', 'ctrl+y'], executeCmd(Redo));
    Mousetrap.bind(['alt+s', 'alt+s'],      executeCmd(Settings));
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
    domEditor.on('drop', function (e) {
        if(e.originalEvent.dataTransfer){
            if(e.originalEvent.dataTransfer.files.length) {
                e.preventDefault();
                e.stopPropagation();
                /*UPLOAD FILES HERE*/
                var file = e.originalEvent.dataTransfer.files[0],
                    reader = new FileReader();
                reader.onloadend = function(event) {
                    executeCmd(LoadModel, event.target.result)(e);
                };
                reader.readAsText(file);
            }
        }
    });
});