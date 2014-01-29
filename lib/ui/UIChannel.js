var AbstractEntity = require('./AbstractEntity');

/**
 * Created by leiko on 27/01/14.
 */
var UIChannel = AbstractEntity.extend({
    toString: 'UIChannel',

    construct: function (instance) {
        var circle = new Kinetic.Circle({
            name: AbstractEntity.CONTAINER,
            radius: 45,
            fill: '#de7c37',
            stroke: 'white',
            strokeWidth: 3,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffset: [5, 5],
            shadowOpacity: 0.2,
            opacity: 0.6
        });

        var text = new Kinetic.Text({
            name: AbstractEntity.TEXT,
            text: instance.name + '\n' + instance.typeDefinition.name,
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            fill: '#FFF',
            align: 'center',
            width: circle.getWidth()-10
        });
        text.offsetX(text.getWidth()/2);
        text.offsetY(text.getHeight()/2);

        this.shape.add(circle);
        this.shape.add(text);

        console.log('UIChannel', this.shape);
    },

    update: function () {
        var textShape = this.shape.find('.'+AbstractEntity.TEXT)[0];
        textShape.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
        this.shape.getLayer().batchDraw();
    }
});

module.exports = UIChannel;
