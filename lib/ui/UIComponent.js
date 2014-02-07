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

        this.shape.on('dragstart', function (e) {
            e.cancelBubble = true;
            console.log('dragstart', instance.name);
            editor.setDraggedElement({type: 'component', instance: instance, shape: this.shape, typeDef: false});
            
            var position = this.shape.getAbsolutePosition();
            var layer = this.shape.getLayer();
            hostInstance.removeComponents(instance);
            layer.add(this.shape);
            this.shape.setPosition(position);
            this.shape.getLayer().batchDraw();
        }.bind(this));
        
        this.shape.on('dragend', function (e) {
            console.log('dragend', instance.name);
            e.cancelBubble = true;

            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = this.shape.getLayer().find('.node-instance');
            var topLevelShape = null;
            for (var i=0; i < nodeShapes.length; i++) {
                if (nodeShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() < nodeShapes[i].getParent().getZIndex())) {
                        topLevelShape = nodeShapes[i].getParent();
                    }
                }
            }

            this.shape.remove();
            
            if (topLevelShape) {
                topLevelShape.fire('mouseup');
            } else {
                hostInstance.addComponents(instance);    
            }

            editor.setDraggedElement(null);
        }.bind(this));
        
        this.shape.on('dragmove', function () {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = this.shape.getLayer().find('.node-instance');
            var topLevelShape = null;
            for (var i=0; i < nodeShapes.length; i++) {
                if (nodeShapes[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() < nodeShapes[i].getParent().getZIndex())) {
                        if (topLevelShape) topLevelShape.fire('mousenotover');
                        topLevelShape = nodeShapes[i].getParent();
                    }
                } else {
                    nodeShapes[i].getParent().fire('mousenotover');       
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseover');
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