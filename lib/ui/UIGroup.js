var AbstractEntity      = require('./AbstractEntity'),
    UIWire              = require('./UIWire'),
    DeleteGroup         = require('../command/model/DeleteGroup'),
    AddFragDictionary   = require('../command/model/AddFragDictionary'),
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
        
        var circle = new Kinetic.Circle({
            radius: 55,
            fill: 'green',
            stroke: 'black',
            strokeWidth: 4,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: [5],
            shadowOpacity: 0.2,
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
            this.addFragDicCmd.execute(this.instance, node);
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
            var uiWire = new UIWire(instance, editor);
            editor.setDraggedElement({type: 'wire', ui: uiWire});
            editor.getUI().getWiresLayer().add(uiWire.getShape());
            e.cancelBubble = true;
        }.bind(this));

        this.plug.on('mouseup touchend', function (e) {
            e.cancelBubble = true; // prevent group to be clicked when plug is clicked
        }.bind(this));
        
        this.shape.on('dragmove', function () {
            editor.getUI().getWiresLayer().batchDraw();
        });
    },

    getPlugPosition: function () {
        return this.plug.getAbsolutePosition();
    },
    
    onAddSubNode: function (node) {
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
    }
});

module.exports = UIGroup;
