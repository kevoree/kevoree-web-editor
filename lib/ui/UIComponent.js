var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    DeleteComponent = require('../command/model/DeleteComponent');

/**
 * Created by leiko on 28/01/14.
 */
var UIComponent = HostedEntity.extend({
    toString: 'UIComponent',

    /**
     *
     * @param instance Kevoree Component instance
     * @param hostInstance Kevoree Node instance (that hosts that component)
     * @param editor KevWebEditor object
     */
    construct: function (instance, editor, hostInstance) {
        console.log('CREATE COMP UI WITH NAME:', instance.name);
        
        this.text = new Kinetic.Text({
            id:         AbstractEntity.TEXT+'_'+instance.path(),
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
            editor.setDraggedElement({type: 'component', instance: instance, shape: this.shape, typeDef: false});

            var position = this.shape.getAbsolutePosition();
            this.shape.moveTo(this.shape.getLayer());
            this.shape.setPosition(position);
            this.shape.setZIndex(0);
            this.shape.fire('dragstart.fake');
            this.shape.getLayer().batchDraw();

            hostInstance.removeComponents(instance);
            console.log('dragstart', instance.name, position);

        }.bind(this));

        this.shape.on('dragend', function () {
            console.log(instance);
            if (!instance.host) {
                // component has been dropped into the wild => put it back in its old host node
                hostInstance.addComponents(instance);
            }
            editor.setDraggedElement(null);
            console.log('dragend', instance.name);
        }.bind(this));
        
        this.deleteCmd = new DeleteComponent(editor);
    },

    refreshShapeAttributes: function () {
        this.text.setWidth(this.bgRect.getWidth());
    },

    onDelete: function () {
        this.deleteCmd.execute(this.instance, this.hostInstance);
    },

    update: function () {
        // Hosted entities subClass needs to redefine update because
        // the host shape act as a container for hosted shapes, so a call
        // to this.shape.find('.TEXT') would return every hosted text shape too
        this.shape.id(this.instance.path());

        var textShape = this.shape.find('#'+AbstractEntity.TEXT+'_'+this.instance.path())[0];
        if (textShape) {
            textShape.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            this.shape.getLayer().batchDraw();
        }
    }
});

module.exports = UIComponent;