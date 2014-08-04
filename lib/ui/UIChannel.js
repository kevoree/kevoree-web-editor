var AbstractEntity          = require('./AbstractEntity'),
    DeleteChannel           = require('../command/model/DeleteChannel'),
    AddBinding              = require('../command/model/AddBinding'),
    DeleteBinding           = require('../command/model/DeleteBinding'),
    OpenChannelProps        = require('../command/ui/OpenChannelProps'),
    UIWire                  = require('./UIWire'),
    AddFragDictionary       = require('../command/model/AddFragDictionary'),
    DeleteFragDictionary    = require('../command/model/DeleteFragDictionary'),
    ModelHelper             = require('../util/ModelHelper');


var RADIUS = 45,
    SELECTED_COLOR = 'orange',
    NORMAL_COLOR = 'white';

/**
 * Created by leiko on 27/01/14.
 */
var UIChannel = AbstractEntity.extend({
    toString: 'UIChannel',

    construct: function (instance, editor) {
        this.addFragDicCmd = new AddFragDictionary(editor);
        this.delFragDicCmd = new DeleteFragDictionary(editor);
        this.delBindingCmd = new DeleteBinding(editor);
        
        this.circle = new Kinetic.Circle({
            name: 'droppable-instance',
            radius: RADIUS,
            fill: '#de7c37',
            stroke: NORMAL_COLOR,
            strokeWidth: 3,
            opacity: 0.6
        });

        this.text = new Kinetic.Text({
            text: instance.name + '\n' + instance.typeDefinition.name,
            fontSize: 13,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            fill: (this.instance.started) ? '#fff' : 'black',
            align: 'center',
            width: this.circle.getWidth()-10
        });
        this.text.offsetX(this.text.getWidth()/2);
        this.text.offsetY(this.text.getHeight()/2);

        this.shape.add(this.circle);
        this.shape.add(this.text);

        var bindings = instance.bindings.iterator();
        while (bindings.hasNext()) {
            var binding = bindings.next();
            var uiWire = new UIWire(binding.port, editor, instance);
            var isReady = uiWire.ready();
            if (isReady) {
                editor.getUI().getWiresLayer().add(uiWire.getShape());
                this.addFragDicCmd.execute(this.instance, binding.port.eContainer().eContainer());
            }
        }

        this.deleteCmd = new DeleteChannel(editor);
        this.openPropsCmd = new OpenChannelProps(editor, this);

        this.shape.on('mouseover touchmove', function (e) {
            e.cancelBubble = true;
            var draggedEntity = editor.getDraggedElement();
            if (draggedEntity && this.shape.getLayer()) {
                if (draggedEntity.type === 'wire') {
                    if (ModelHelper.findInstanceType(draggedEntity.ui.getSrcInstance()) === 'port') {
                        var bindings = instance.bindings.iterator();
                        while (bindings.hasNext()) {
                            var binding = bindings.next();
                            if (binding.port.path() === draggedEntity.ui.getSrcInstance().path()) {
                                // already connected
                                this.circle.setStroke('#F00');
                                this.shape.getLayer().batchDraw();
                                return;
                            }
                        }
                        this.circle.setStroke('#0F0');
                        this.shape.getLayer().batchDraw();
                    }

                } else {
                    this.circle.setStroke('#F00');
                    this.shape.getLayer().batchDraw();
                }
            }
        }.bind(this));

        this.shape.on('mouseout mousenotover touchend', function () {
            if (this.isSelected) {
                this.circle.setStroke(SELECTED_COLOR);
                this.shape.getLayer().batchDraw();
            } else if (this.shape.getLayer()) {
                this.circle.setStroke(NORMAL_COLOR);
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));

        this.shape.on('dragmove', function () {
            editor.getUI().getWiresLayer().batchDraw();
        });

        var addBindingCmd = new AddBinding(editor);
        this.shape.on('mouseup touchend', function (e) {
            this.shape.getStage().setDraggable(true);
            if (this.isSelected) {
                this.circle.setStroke(SELECTED_COLOR);
                this.shape.getLayer().batchDraw();
            } else if (this.shape.getLayer()) {
                this.circle.setStroke(NORMAL_COLOR);
                this.shape.getLayer().batchDraw();
            }

            var draggedElem = editor.getDraggedElement();
            if (draggedElem) {
                if (draggedElem.type === 'wire') {
                    var uiWire = draggedElem.ui,
                        srcInstance = uiWire.getSrcInstance();
                    if (ModelHelper.findInstanceType(srcInstance) === 'port') {
                        var bindings = instance.bindings.iterator();
                        while (bindings.hasNext()) {
                            var binding = bindings.next();
                            if (binding.port.path() === srcInstance.path()) {
                                // already connected
                                return;
                            }
                        }
                        draggedElem.ui.getShape().remove(); // remove ui because onAddBinding will do the work
                        addBindingCmd.execute(srcInstance, instance);
                        uiWire.setTarget(instance);
                        uiWire.ready();
                        editor.getUI().getWiresLayer().batchDraw();
                        editor.setDraggedElement(null);       
                    }
                }
            }
        }.bind(this));

        console.log('UIChannel', this.shape);
    },
    
    getPlugPosition: function (portPlugPos) {
        var pos = this.circle.getAbsolutePosition();

        if (portPlugPos.y >= pos.y) {
            pos.y = pos.y + (RADIUS - 10);
        } else {
            pos.y = pos.y - (RADIUS - 10);
        }

        return pos;
    },

    onRemoveBinding: function (binding) {
        if (binding.port) {
            var node = binding.port.eContainer().eContainer(),
                canDelFragDic = true,
                chan = binding.hub,
                bindings = chan.bindings.iterator();

            while (bindings.hasNext()) {
                var b = bindings.next();
                if (b.generated_KMF_ID !== binding.generated_KMF_ID) {
                    if (b.port.eContainer().eContainer().name === node.name) {
                        canDelFragDic = false;
                        break;
                    }
                }
            }

            if (canDelFragDic) {
                this.delFragDicCmd.execute(this.instance, node);
            }
        }
    },

    onAddBinding: function (binding) {
        var uiWire = new UIWire(binding.port, this.editor, this.instance);
        var isReady = uiWire.ready();
        if (isReady) {
            var wiresLayer = this.editor.getUI().getWiresLayer();
            wiresLayer.add(uiWire.getShape());
            wiresLayer.batchDraw();
            this.addFragDicCmd.execute(this.instance, binding.port.eContainer().eContainer());

        }
    },

    setSelected: function (boolean) {
        if (boolean) {
            this.circle.setStroke(SELECTED_COLOR);
            this.shape.getLayer().batchDraw();
        } else {
            this.circle.setStroke(NORMAL_COLOR);
            this.shape.getLayer().batchDraw();
        }
    }
});

module.exports = UIChannel;
