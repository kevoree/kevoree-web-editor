var AbstractEntity  = require('./AbstractEntity'),
    UIWire          = require('./UIWire'),
    DeleteGroup     = require('../command/model/DeleteGroup');

// CONSTANTS
var PLUG_RADIUS = 12;

/**
 * Created by leiko on 27/01/14.
 */
var UIGroup = AbstractEntity.extend({
    toString: 'UIGroup',

    construct: function (instance, editor) {
        var circle = new Kinetic.Circle({
            name: AbstractEntity.CONTAINER,
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

        var text = new Kinetic.Text({
            name: AbstractEntity.TEXT,
            text: this.instance.name + '\n' + this.instance.typeDefinition.name,
            fontSize: 13,
            fontFamily: 'Helvetica',
            fill: '#FFF',
            align: 'center',
            width: circle.getWidth()-10
        });
        text.offsetX(text.getWidth()/2);
        text.offsetY(text.getHeight()/2);

        this.plug = new Kinetic.Circle({
            y: (circle.radius() / 2) + 12,
            radius: PLUG_RADIUS,
            fill: '#f1c30f'
        });

        this.shape.add(circle);
        this.shape.add(text);
        this.shape.add(this.plug);

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
            console.log('plug mousedown')
            var uiWire = new UIWire(instance, editor);
            this.shape.getLayer().add(uiWire.getShape());
            e.cancelBubble = true;
        }.bind(this));

        this.plug.on('mouseup touchend', function (e) {
            console.log('plug mouseup');
            editor.getUI().endWireCreation();
            e.cancelBubble = true; // prevent group to be clicked when plug is clicked
        }.bind(this));
        
        this.deleteCmd = new DeleteGroup(editor);
    },
    
    onDelete: function () {
        this.deleteCmd.execute(this.instance);
    },

    getPlugPosition: function () {
        return this.plug.getAbsolutePosition();
    }
});

module.exports = UIGroup;
