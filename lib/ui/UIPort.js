var AbstractEntity = require('./AbstractEntity');

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
    
    construct: function (portTypeRef, editor, compInstance, isProvided) {
        this.portTypeRef = portTypeRef;
        this.provided = isProvided;

        this.circle = new Kinetic.Circle({
            x: RADIUS,
            y: RADIUS,
            radius: RADIUS,
            stroke: (!isProvided) ? '#C60808' : '#ECCA40',
            fillLinearGradientStartPoint: {x: 0, y: 0},
            fillLinearGradientEndPoint: {x: 0, y: RADIUS*2},
            fillLinearGradientColorStops: [0, '#bc7645', 1, '#8e7361'],
            strokeWidth: 2
        });
        
        this.text = new Kinetic.Text({
            x: RADIUS,
            y: RADIUS,
            text: portTypeRef.name.substr(0, 5),
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
    },
    
    isProvided: function () {
        return this.provided;
    },
    
    getWidth: function () {
        return this.circle.getRadius()*2;
    },
    
    getHeight: function () {
        return this.circle.getRadius()*2 + this.text.getHeight();
    }
});

module.exports = UIPort;