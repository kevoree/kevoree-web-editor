var Class = require('pseudoclass'),
    ActionType = require('kevoree-library').org.kevoree.modeling.api.util.ActionType;

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 07/02/14
 * Time: 15:03
 */
var AbstractEventProcessor = Class({
    toString: 'AbstractEventProcessor',

    construct: function (editor, ui) {
        this.editor = editor;
        this.ui = ui;
        
        this.postProcesses = [];
    },

    setModel: function (model) {
        this.model = model;
    },

    processor: function () {
        return { elementChanged : this.processEvent.bind(this) };
    },

    processEvent: function (event) {
        if (this.editor.delayingEventProcessor()) {
            console.log('PROCESS LATER', this.toString(), event);
            this.postProcesses.push(event);

        } else {
            console.log('PROCESS NOW', this.toString(), event);
            if      (event.etype === ActionType.object.REMOVE)      this.processRemove(event);
            else if (event.etype === ActionType.object.ADD)         this.processAdd(event);
            else if (event.etype === ActionType.object.SET)         this.processSet(event);
            else if (event.etype === ActionType.object.REMOVE_ALL)  this.processRemoveAll(event);
            else console.log(this.toString()+' unhandled event', event.toString());
        }
    },
    
    doPostProcess: function () {
        console.log('DO POST PROCESS');
        for (var i in this.postProcesses) {
            console.log('GONNA POST PROCESS', this.postProcesses[i]);
            this.processEvent(this.postProcesses[i]);
        }
        
        // clear postProcesses array
        this.postProcesses.length = 0;
    },
    
    processRemove: function (e) {},
    processAdd: function (e) {},
    processSet: function (e) {},
    processRemoveAll: function (e) {}
});

module.exports = AbstractEventProcessor;
