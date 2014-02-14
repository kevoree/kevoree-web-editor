var AbstractEntity = require('./AbstractEntity'),
    DeleteChannel  = require('../command/model/DeleteChannel');

/**
 * Created by leiko on 27/01/14.
 */
var UIChannel = AbstractEntity.extend({
    toString: 'UIChannel',

    construct: function (instance, editor) {
        var circle = new Kinetic.Circle({
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

        this.text = new Kinetic.Text({
            text: instance.name + '\n' + instance.typeDefinition.name,
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            fill: '#FFF',
            align: 'center',
            width: circle.getWidth()-10
        });
        this.text.offsetX(this.text.getWidth()/2);
        this.text.offsetY(this.text.getHeight()/2);

        this.shape.add(circle);
        this.shape.add(this.text);

        console.log('UIChannel', this.shape);
        
        this.deleteCmd = new DeleteChannel(editor);
    }
});

module.exports = UIChannel;
