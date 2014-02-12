var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    UIPort          = require('./UIPort'),
    DeleteComponent = require('../command/model/DeleteComponent');

var PORTS_PADDING = 8;

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
        this.portUIs = [];

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
            cornerRadius:  5,
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
            cornerRadius:  5,
            shadowColor:   'black',
            shadowBlur:    10,
            shadowOffset:  [5, 5],
            shadowOpacity: 0.6
        });

        this.shape.add(this.bgRect);
        this.shape.add(this.border);
        this.shape.add(this.text);

        var portWidth = 0,
            portHeight = 0;
        function addPortUIs(portList, isProvided) {
            while (portList.hasNext()) {
                var port = portList.next();
                var portUI = new UIPort(port, editor, instance, isProvided);
                this.portUIs.push(portUI);
                this.shape.add(portUI.getShape());
                portWidth = portUI.getWidth();
                portHeight = portUI.getHeight();
            }
        }
        addPortUIs.bind(this)(instance.typeDefinition.provided.iterator(), true);
        addPortUIs.bind(this)(instance.typeDefinition.required.iterator(), false);

        // compute this component width according to ports
        var providedCount = instance.typeDefinition.provided.size();
        var requiredCount = instance.typeDefinition.required.size();
        console.log('width', portWidth);
        if (providedCount > 0 && requiredCount > 0) {
            this.setWidth(this.border.getWidth()+portWidth*2+PORTS_PADDING*2);

        } else if ((providedCount > 0 && requiredCount === 0) || (providedCount === 0 && requiredCount > 0)) {
            this.setWidth(this.border.getWidth()+portWidth+PORTS_PADDING*2);
        }
        
        // compute this component height according to ports
        if (providedCount > 1 || providedCount > 1) {
            var height = this.border.getHeight();
            console.log('height', portHeight);
            console.log('counts', providedCount, requiredCount);
            if (providedCount >= requiredCount) {
                height += providedCount*portHeight;
            } else {
                height += requiredCount*portHeight;
            }
            this.setHeight(height);
        }

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
        var providedY = 5,
            requiredY = 5;
        
        // compute provided & required port positions
        for (var i in this.portUIs) {
            if (this.portUIs[i].isProvided()) {
                this.portUIs[i].getShape().setX(PORTS_PADDING);
                this.portUIs[i].getShape().setY(providedY);
                providedY += this.portUIs[i].getHeight()-5;
            } else {
                this.portUIs[i].getShape().setX(this.bgRect.getWidth() - this.portUIs[i].getWidth() - PORTS_PADDING);
                this.portUIs[i].getShape().setY(requiredY);
                requiredY += this.portUIs[i].getHeight()-5;
            }
        }
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