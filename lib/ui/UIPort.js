var AbstractEntity = require('./AbstractEntity'),
    UIWire         = require('./UIWire');

var PADDING = 20,
    RADIUS  = 12;

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 12/02/14
 * Time: 09:39
 */
var UIPort = AbstractEntity.extend({
    toString: 'UIPort',

    construct: function (instance, editor, isProvided) {
        this.wires = [];
        this.instance = instance;
        this.instance.ui = this;
        this.provided = isProvided;

        this.circle = new Kinetic.Circle({
            x: RADIUS,
            y: RADIUS,
            radius: RADIUS,
            stroke: (isProvided) ? '#ECCA40' : '#C60808',
            fillLinearGradientStartPoint: {x: 0, y: 0},
            fillLinearGradientEndPoint: {x: 0, y: RADIUS*2},
            fillLinearGradientColorStops: [0, '#bc7645', 1, '#8e7361'],
            strokeWidth: 2
        });

        this.text = new Kinetic.Text({
            x: RADIUS,
            y: RADIUS,
            text: instance.portTypeRef.name.substr(0, 5),
            fontSize: 9,
            fontStyle: 'bold',
            fontFamily: 'Helvetica',
            fill: '#FFF',
            align: 'center'
        });

        this.text.offsetX(this.text.getWidth()/2);
        this.text.offsetY((this.text.getHeight()/2) - PADDING);

        this.shape.add(this.circle);
        this.shape.add(this.text);
        this.shape.setPosition({x: 0, y: 0});
        this.shape.setDraggable(false);
        this.shape.off('click');

        this.shape.on('mousedown touchstart', function (e) {
            var uiWire = new UIWire(instance, editor);
            editor.setDraggedElement({type: 'wire', ui: uiWire});
            editor.getUI().getWiresLayer().add(uiWire.getShape());
            e.cancelBubble = true;
        });
    },

    isProvided: function () {
        return this.provided;
    },

    getWidth: function () {
        return this.circle.getRadius()*2;
    },

    getHeight: function () {
        return this.circle.getRadius()*2 + this.text.getHeight();
    },
    
    getPlugPosition: function () {
        var pos = this.shape.getAbsolutePosition();
        return {
            x: pos.x + RADIUS,
            y: pos.y + RADIUS
        };
    },
    
    getWireColor: function () {
        if (this.provided) {
            return '#ECCA40';
        } else {
            return '#C60808';
        }
    },
    
    onDelete: function () {
        for (var i in this.wires) this.wires[i].getShape().remove();
    }
});

module.exports = UIPort;