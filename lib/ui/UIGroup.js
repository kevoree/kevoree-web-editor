var AbstractEntity = require('./AbstractEntity');

/**
 * Created by leiko on 27/01/14.
 */
var UIGroup = AbstractEntity.extend({
    toString: 'UIGroup',

    construct: function (instance) {
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

        var plug = new Kinetic.Circle({
            y: (circle.radius() / 2) + 12,
            radius: 12,
            fill: '#f1c30f'
        });

        this.shape.add(circle);
        this.shape.add(text);
        this.shape.add(plug);

        console.log('UIGroup', this.shape);
    },

    update: function () {
        var textShape = this.shape.find('.'+AbstractEntity.TEXT)[0];
        textShape.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
        this.shape.getLayer().batchDraw();
    }
});

module.exports = UIGroup;
