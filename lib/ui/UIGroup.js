var AbstractEntity      = require('./AbstractEntity'),
    UIWire              = require('./UIWire'),
    OpenGroupProps      = require('../command/ui/OpenGroupProps'),
    DeleteGroup         = require('../command/model/DeleteGroup'),
    AddFragDictionary   = require('../command/model/AddFragDictionary'),
    DeleteFragDictionary= require('../command/model/DeleteFragDictionary'),
    kevoree             = require('kevoree-library').org.kevoree;
    
var factory = new kevoree.impl.DefaultKevoreeFactory();

// CONSTANTS
var PLUG_RADIUS = 12;

/**
 * Created by leiko on 27/01/14.
 */
var UIGroup = AbstractEntity.extend({
    toString: 'UIGroup',

    construct: function (instance, editor) {
        this.deleteCmd = new DeleteGroup(editor);
        this.addFragDicCmd = new AddFragDictionary(editor);
        this.delFragDicCmd = new DeleteFragDictionary(editor);
        
        var circle = new Kinetic.Circle({
            name: 'plug',
            radius: 55,
            fill: 'green',
            stroke: 'black',
            strokeWidth: 4,
            opacity: 0.6
        });

        this.text = new Kinetic.Text({
            text: this.instance.name + '\n' + this.instance.typeDefinition.name,
            fontSize: 13,
            fontFamily: 'Helvetica',
            fill: '#FFF',
            align: 'center',
            width: circle.getWidth()-10
        });
        this.text.offsetX(this.text.getWidth()/2);
        this.text.offsetY(this.text.getHeight()/2);

        this.plug = new Kinetic.Circle({
            y: (circle.radius() / 2) + 12,
            radius: PLUG_RADIUS,
            fill: '#f1c30f'
        });

        this.shape.add(circle);
        this.shape.add(this.text);
        this.shape.add(this.plug);

        var subNodes = instance.subNodes.iterator();
        while (subNodes.hasNext()) {
            var node = subNodes.next();
            var uiWire = new UIWire(instance, editor, node);
            uiWire.ready();
            editor.getUI().getWiresLayer().add(uiWire.getShape());
        }

        console.log('UIGroup', this.shape);

        this.plug.on('mouseover', function () {
            this.plug.setRadius(PLUG_RADIUS+1);
            this.shape.getLayer().batchDraw();
        }.bind(this));

        this.plug.on('mouseout', function () {
            this.plug.setRadius(PLUG_RADIUS);
            this.shape.getLayer().batchDraw();
        }.bind(this));

        this.plug.on('mousedown touchstart', function (e) {
            this.shape.getStage().setDraggable(false);
            var uiWire = new UIWire(instance, editor);
            editor.setDraggedElement({type: 'wire', ui: uiWire});
            editor.getUI().getWiresLayer().add(uiWire.getShape());
            e.cancelBubble = true;
        }.bind(this));

        this.plug.on('mouseup touchend', function (e) {
            this.shape.getStage().setDraggable(true);
            e.cancelBubble = true; // prevent group to be clicked when plug is clicked
        }.bind(this));
        
        this.shape.on('dragmove', function () {
            editor.getUI().getWiresLayer().batchDraw();
        });

        var openGroupPropsCmd = new OpenGroupProps(editor, this);
        this.shape.on('click', function (e) {
            openGroupPropsCmd.execute(instance);
            e.cancelBubble = true;
        });
    },

    getPlugPosition: function () {
        return this.plug.getAbsolutePosition();
    },
    
    onAddSubNode: function (node) {
        // check whether or not we have to add a wire for this subNode or not
        var wireNeeded = true;
        for (var i in this.wires) {
            if (this.wires[i].getTargetInstance().name === node.name) {
                wireNeeded = false;
                break;
            }
        }
        if (wireNeeded) {
            var uiWire = new UIWire(this.instance, this.editor, node);
            uiWire.ready();
            this.editor.getUI().getWiresLayer().add(uiWire.getShape());
        }

        // check whether or not it is necessary to add a FragmentDictionary for this node
        var fragDics = this.instance.fragmentDictionary.iterator();
        while (fragDics.hasNext()) {
            var fragDic = fragDics.next();
            if (fragDic.name === node.name) {
                // there is already an instance of fragDictionary for this node in this group
                // so we do not need to add one
                return;
            }
        }
        
        // if we end-up here it means that there is no fragDep for this node yet => create it
        this.addFragDicCmd.execute(this.instance, node);
    },
    
    onRemoveSubNode: function (node) {
        this.delFragDicCmd.execute(this.instance, node);
    }
});

module.exports = UIGroup;
