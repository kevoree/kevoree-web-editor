var HostedEntity    = require('./HostedEntity'),
    AbstractEntity  = require('./AbstractEntity'),
    UIPort          = require('./UIPort'),
    DeleteComponent = require('../command/model/DeleteComponent'),
    OpenCompProps   = require('../command/ui/OpenCompProps'),
    AddPort         = require('../command/model/AddPort');

var PORTS_PADDING = 8;

/**
 * Created by leiko on 28/01/14.
 */
var UIComponent = HostedEntity.extend({
    toString: 'UIComponent',

    /**
     *
     * @param instance Kevoree Component instance
     * @param editor KevWebEditor object
     */
    construct: function (instance, editor) {
        this.nodeHost = instance.eContainer();
        this.portUIs = [];

        this.text = new Kinetic.Text({
            text:       instance.name + '\n' + instance.typeDefinition.name,
            fontSize:   13,
            fontFamily: 'Helvetica',
            fill:       '#fff',
            padding:    8,
            align:      'center'
        });

        this.bgRect = new Kinetic.Rect({
            width:   this.text.getWidth(),
            height:  this.text.getHeight(),
            fill:    (instance.started) ? '#000' : '#333',
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
            cornerRadius:  5
        });

        this.shape.add(this.bgRect);
        this.shape.add(this.border);
        this.shape.add(this.text);

        var portWidth = 0,
            portHeight = 0;
        var addPortCmd = new AddPort(editor);

        function addPortInstances(portTypeList, isProvided) {
            function alreadyCreated(portTypeRef) {
                var portList;
                if (isProvided) {
                    portList = instance.provided.iterator();
                } else {
                    portList = instance.required.iterator();
                }
                while (portList.hasNext()) {
                    if (portList.next().portTypeRef.name === portTypeRef.name) {
                        return true;
                    }
                }
                return false;
            }
            
            while (portTypeList.hasNext()) {
                var portTypeRef = portTypeList.next();
                var isAlreadyCreated = alreadyCreated(portTypeRef);
                if (!isAlreadyCreated) {
                    addPortCmd.execute(instance, portTypeRef, isProvided);
                }
            }
        }
        
        var addPortUIs = function (portList, isProvided) {
            while (portList.hasNext()) {
                var port = portList.next();
                var portUI = new UIPort(port, editor, isProvided);
                this.portUIs.push(portUI);
                this.shape.add(portUI.getShape());
                portWidth = portUI.getWidth();
                portHeight = portUI.getHeight();
            }
        }.bind(this);

        addPortInstances(instance.typeDefinition.provided.iterator(), true);
        addPortInstances(instance.typeDefinition.required.iterator(), false);
        addPortUIs(instance.provided.iterator(), true);
        addPortUIs(instance.required.iterator(), false);

        // compute this component width according to ports
        var providedCount = instance.typeDefinition.provided.size();
        var requiredCount = instance.typeDefinition.required.size();
        if (providedCount > 0 && requiredCount > 0) {
            this.setWidth(this.border.getWidth()+portWidth*2+PORTS_PADDING*2);

        } else if ((providedCount > 0 && requiredCount === 0) || (providedCount === 0 && requiredCount > 0)) {
            this.setWidth(this.border.getWidth()+portWidth+PORTS_PADDING*2);
        }

        // compute this component height according to ports
        if ((providedCount + requiredCount) > 0) {
            if (providedCount >= requiredCount) {
                this.setHeight(providedCount*(portHeight+PORTS_PADDING)+PORTS_PADDING/2);
            } else {
                this.setHeight(requiredCount*(portHeight+PORTS_PADDING)+PORTS_PADDING/2);
            }
        }

        this.defaultWidth = this.text.getWidth();

        this.shape.on('dragstart', function (e) {
            e.cancelBubble = true;
            
            // redefine node host in order to put it back in if release inside something else than a node
            this.nodeHost = this.instance.eContainer();
            
            editor.setDraggedElement({type: 'component', instance: instance, shape: this.shape, typeDef: false});

            var position = this.shape.getAbsolutePosition();
            var layer = this.shape.getLayer();
            instance.eContainer().removeComponents(instance);
            layer.add(this.shape);
            this.shape.setPosition(position);
            this.shape.getLayer().batchDraw();
        }.bind(this));

        this.shape.on('dragend', function (e) {
            console.log('dragend', instance.name);
            e.cancelBubble = true;

            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var nodeShapes = this.shape.getLayer().find('.droppable-instance');
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
                // component has been released into the wild, put it back in its old container
                this.nodeHost.addComponents(instance);
            }

            editor.setDraggedElement(null);
        }.bind(this));

        this.shape.on('dragmove', function () {
            var pointerPos = editor.getUI().getStage().getPointerPosition();
            var droppableShape = this.shape.getLayer().find('.droppable-instance');
            var topLevelShape = null;
            for (var i=0; i < droppableShape.length; i++) {
                if (droppableShape[i].intersects(pointerPos)) {
                    if (!topLevelShape || (topLevelShape.getZIndex() < droppableShape[i].getParent().getZIndex())) {
                        if (topLevelShape) topLevelShape.fire('mousenotover');
                        topLevelShape = droppableShape[i].getParent();
                    }
                } else {
                    droppableShape[i].getParent().fire('mousenotover');
                }
            }
            if (topLevelShape) topLevelShape.fire('mouseover');

            // redraw wire layer so that wires can update there position on dragmove
            editor.getUI().getWiresLayer().batchDraw();
        }.bind(this));

        this.deleteCmd = new DeleteComponent(editor);
        this.openPropsCmd = new OpenCompProps(editor, this);
    },

    refreshShapeAttributes: function () {
        var providedY = 5,
            requiredY = 5;

        if (!this.instance.eContainer()) {
            this.setWidth(this.defaultWidth);
        }

        // compute provided & required port positions
        for (var i in this.portUIs) {
            if (this.portUIs[i].isProvided()) {
                this.portUIs[i].getShape().setX(PORTS_PADDING);
                this.portUIs[i].getShape().setY(providedY);
                providedY += this.portUIs[i].getHeight()+PORTS_PADDING;
            } else {
                this.portUIs[i].getShape().setX(this.bgRect.getWidth() - this.portUIs[i].getWidth() - PORTS_PADDING);
                this.portUIs[i].getShape().setY(requiredY);
                requiredY += this.portUIs[i].getHeight()+PORTS_PADDING;
            }
        }
    },

    onDelete: function (_super) {
        _super.call(this);
        for (var i in this.portUIs) this.portUIs[i].onDelete();
    },

    update: function () {
        if (this.shape.getLayer()) {
            this.shape.id(this.instance.path());
            this.text.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            this.bgRect.fill((this.instance.started) ? '#000' : '#333');
            this.shape.getLayer().batchDraw();
        }
    },
    
    onSet: function (attrName, sourcePath, previousVal, value) {
        if (typeof(value) !== 'undefined' && value != null) {
            if (attrName === 'typeDefinition') {
                this.instance.removeAllRequired();
                this.instance.removeAllProvided();
                this.instance.removeAllModelElementListeners();
                var parent = this.shape.getParent();
                this.shape.destroy();
                this.instance.ui = new UIComponent(this.instance, this.editor);
                parent.add(this.instance.ui.getShape());
                parent.getLayer().batchDraw();

            } else {
                this.update();
                if (this.instance.eContainer() && this.instance.eContainer().ui) {
                    this.instance.eContainer().ui.update();
                }
            }
        }
    },

    show: function () {
        this.shape.show();
        var provided = this.instance.provided.iterator(),
            required = this.instance.required.iterator();
        while (provided.hasNext()) {
            provided.next().ui.show();
        }
        while (required.hasNext()) {
            required.next().ui.show();
        }
    },

    hide: function (_super) {
        _super.call(this);
        var provided = this.instance.provided.iterator(),
            required = this.instance.required.iterator();
        while (provided.hasNext()) {
            provided.next().ui.hide();
        }
        while (required.hasNext()) {
            required.next().ui.hide();
        }
    },

    setSelected: function (boolean) {
        if (boolean) {
            this.border.setStroke('orange');
            this.shape.getLayer().batchDraw();
        } else {
            this.border.setStroke('white');
            this.shape.getLayer().batchDraw();
        }
    }
});

module.exports = UIComponent;