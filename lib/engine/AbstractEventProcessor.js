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
        this.model = editor.getModel();
        this.ui = ui;
    },

    setModel: function (model) {
        this.model = model;
    },

    processor: function () {
        return {
            elementChanged : function (event) {
                if      (event.getType() === ActionType.object.REMOVE)      this.processRemove(event);
                else if (event.getType() === ActionType.object.ADD)         this.processAdd(event);
                else if (event.getType() === ActionType.object.SET)         this.processSet(event);
                else console.log(this.toString()+' unhandled event', event.getType());

            }.bind(this)
        }
    },
    
    processRemove: function (e) {},
    processAdd: function (e) {},
    processSet: function (e) {}
});

module.exports = AbstractEventProcessor;
