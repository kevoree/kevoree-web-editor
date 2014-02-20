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
        return { elementChanged : processEvent.bind(this) };
    },
    
    doPostProcess: function () {
        for (var i in this.postProcesses) {
            processEvent.bind(this)(this.postProcesses[i]);
        }
        
        // clear postProcesses array
        this.postProcesses.length = 0;
    },
    
    processRemove: function (e) {},
    processAdd: function (e) {},
    processSet: function (e) {},
    processRemoveAll: function (e) {}
});

function processEvent(event) {
    if (this.editor.delayingEventProcessor()) {
        this.postProcesses.push(event);

    } else {
        if      (event.getType() === ActionType.object.REMOVE)      this.processRemove(event);
        else if (event.getType() === ActionType.object.ADD)         this.processAdd(event);
        else if (event.getType() === ActionType.object.SET)         this.processSet(event);
        else if (event.getType() === ActionType.object.REMOVE_ALL)  this.processRemoveAll(event);
        else console.log(this.toString()+' unhandled event', event.toString());
    }
}

module.exports = AbstractEventProcessor;
