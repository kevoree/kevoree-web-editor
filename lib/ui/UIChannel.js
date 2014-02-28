var AbstractEntity          = require('./AbstractEntity'),
    DeleteChannel           = require('../command/model/DeleteChannel'),
    AddBinding              = require('../command/model/AddBinding'),
    OpenChannelProps        = require('../command/ui/OpenChannelProps'),
    UIWire                  = require('./UIWire'),
    AddFragDictionary       = require('../command/model/AddFragDictionary'),
    DeleteFragDictionary    = require('../command/model/DeleteFragDictionary'),
    ModelHelper             = require('../util/ModelHelper');


var RADIUS = 45;

/**
 * Created by leiko on 27/01/14.
 */
var UIChannel = AbstractEntity.extend({
    toString: 'UIChannel',

    construct: function (instance, editor) {
        this.addFragDicCmd = new AddFragDictionary(editor);
        this.delFragDicCmd = new DeleteFragDictionary(editor);
        
        this.circle = new Kinetic.Circle({
            name: 'droppable-instance',
            radius: RADIUS,
            fill: '#de7c37',
            stroke: 'white',
            strokeWidth: 3,
            opacity: 0.6
        });

        this.text = new Kinetic.Text({
            text: instance.name + '\n' + instance.typeDefinition.name,
            fontSize: 13,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            fill: '#FFF',
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
            uiWire.ready();
            editor.getUI().getWiresLayer().add(uiWire.getShape());
            this.addFragDicCmd.execute(this.instance, binding.port.eContainer().eContainer());
        }

        this.deleteCmd = new DeleteChannel(editor);

        var openChanPropsCmd = new OpenChannelProps(editor, this);
        this.shape.on('click', function (e) {
            openChanPropsCmd.execute(instance);
            e.cancelBubble = true;
        });

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
            if (this.shape.getLayer()) {
                this.circle.setStroke('#FFF');
                this.shape.getLayer().batchDraw();
            }
        }.bind(this));

        this.shape.on('dragmove', function () {
            editor.getUI().getWiresLayer().batchDraw();
        });

        var addBindingCmd = new AddBinding(editor);
        this.shape.on('mouseup touchend', function (e) {
            this.shape.getStage().setDraggable(true);
            if (this.shape.getLayer()) {
                this.circle.setStroke('#FFF');
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
        var stagePos = (this.shape.getStage()) ? this.shape.getStage().getPosition() : {x: 0, y: 0};
        
        if (portPlugPos.y >= pos.y - stagePos.y) pos.y = pos.y + (RADIUS - 10);
        else pos.y = pos.y - (RADIUS - 10);
        
        pos.x -= stagePos.x;
        pos.y -= stagePos.y;
        
        return pos;
    },

    onRemoveBinding: function (binding) {
        this.delFragDicCmd.execute(this.instance, binding.port.eContainer().eContainer());
    }    
});

module.exports = UIChannel;
