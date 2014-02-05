var HostedEntity = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity');

/**
 * Created by leiko on 28/01/14.
 */
var UIComponent = HostedEntity.extend({
    toString: 'UIComponent',

    /**
     *
     * @param instance Kevoree Component instance
     * @param nodeInstance Kevoree Node instance (that hosts that component)
     * @param editor KevWebEditor object
     */
    construct: function (instance, editor, nodeInstance) {
        console.log("UIComponent", instance.name, editor.toString(), nodeInstance.name);

        this.text = new Kinetic.Text({
            name:       AbstractEntity.TEXT,
            text:       instance.name + '\n' + instance.typeDefinition.name,
            fontSize:   14,
            fontFamily: 'Helvetica',
            fill:       '#FFF',
            padding:    8,
            align:      'center'
        });

        this.bgRect = new Kinetic.Rect({
            width:   this.text.getWidth(),
            height:  this.text.getHeight(),
            fill:    'black',
            cornerRadius:  10,
            opacity: 0.9
        });

        this.bgRect.sceneFunc(function (context) {
            this.refreshShapeAttributes();
            this.bgRect._sceneFunc(context);
        }.bind(this));

        this.border = new Kinetic.Rect({
            width:         this.bgRect.getWidth(),
            height:        this.bgRect.getHeight(),
            stroke:        'white',
            strokeWidth:   1,
            cornerRadius:  10,
            shadowColor:   'black',
            shadowBlur:    10,
            shadowOffset:  [5, 5],
            shadowOpacity: 0.6
        });

        this.shape.add(this.bgRect);
        this.shape.add(this.border);
        this.shape.add(this.text);

        this.shape.on('dragstart', function () {
            nodeInstance.removeComponents(instance);
            editor.setDraggedElement({type: 'component', instance: instance, shape: this.shape, typeDef: false});

            var position = this.shape.getAbsolutePosition();
            this.shape.moveTo(this.shape.getLayer());
            this.shape.setPosition(position);
            this.shape.setZIndex(0);
            this.shape.fire('dragstart.fake');
            this.shape.getLayer().batchDraw();
            console.log('dragstart', instance.name, position);

        }.bind(this));

        this.shape.on('dragend', function () {
            console.log(instance);
            if (!instance.host) {
                // component has been dropped into the wild => put it back in its old host node
                nodeInstance.addComponents(instance);
            }
            editor.setDraggedElement(null);
            console.log('dragend', instance.name);
        }.bind(this));
    },

    refreshShapeAttributes: function () {
        this.text.setWidth(this.bgRect.getWidth());
    }
});

module.exports = UIComponent;