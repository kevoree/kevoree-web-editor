var AbstractEntity      = require('./AbstractEntity'),
    DeleteBinding       = require('../command/model/DeleteBinding'),
    AddBinding          = require('../command/model/AddBinding'),
    OpenBindingModal    = require('../command/ui/OpenBindingModal'),
    UIWire              = require('./UIWire'),
    ModelHelper         = require('../util/ModelHelper'),
    Alert               = require('../util/Alert');

var PADDING = 20,
    RADIUS  = 12;

/**
 * Created with IntelliJ IDEA.
 * User: leiko
 * Date: 12/02/14
 * Time: 09:39
 */
var UIPort = AbstractEntity.extend({
    toString: 'UIPort',

    construct: function (instance, editor, isProvided) {
        this.wires = [];
        this.instance = instance;
        this.instance.ui = this;
        this.provided = isProvided;

        this.removeBindingCmd = new DeleteBinding(editor);
        this.openBindingModalCmd = new OpenBindingModal(editor);

        this.circle = new Kinetic.Circle({
            name: 'droppable-instance',
            x: RADIUS,
            y: RADIUS,
            radius: RADIUS,
            stroke: (isProvided) ? '#ECCA40' : '#C60808',
            fillLinearGradientStartPoint: {x: 0, y: 0},
            fillLinearGradientEndPoint: {x: 0, y: RADIUS*2},
            fillLinearGradientColorStops: [0, '#bc7645', 1, '#8e7361'],
            strokeWidth: 2
        });

        this.text = new Kinetic.Text({
            x: RADIUS,
            y: RADIUS,
            text: instance.portTypeRef.name.substr(0, 5),
            fontSize: 9,
            fontStyle: 'bold',
            fontFamily: 'Helvetica',
            fill: '#FFF',
            align: 'center'
        });

        this.text.offsetX(this.text.getWidth()/2);
        this.text.offsetY((this.text.getHeight()/2) - PADDING);

        var textBg = new Kinetic.Rect({
            x: RADIUS,
            y: RADIUS,
            width: this.text.getWidth(),
            height: this.text.getHeight(),
            fill: '#000'
        });

        textBg.offsetX(this.text.getWidth()/2);
        textBg.offsetY((this.text.getHeight()/2) - 20);

        var timeout;
        this.text.on('mouseover', function () {
            timeout = setTimeout(function () {
                this.text.setText(instance.portTypeRef.name);
                textBg.setWidth(this.text.getWidth());
                this.shape.getLayer().batchDraw();
            }.bind(this), 250);
        }.bind(this));

        this.text.on('mouseout', function () {
            clearTimeout(timeout);
            this.text.setText(instance.portTypeRef.name.substr(0, 5));
            textBg.setWidth(this.text.getWidth());
            this.shape.getLayer().batchDraw();
        }.bind(this));

        this.shape.add(this.circle);
        this.shape.add(textBg);
        this.shape.add(this.text);
        this.shape.setPosition({x: 0, y: 0});
        this.shape.setDraggable(false);

        this.shape.off('click');
        this.shape.on('click', function (e) {
            // override clicks for UIPort, so that they do not trigger UIComponent click events
            e.cancelBubble = true;
        });

        this.shape.on('mousedown touchstart', function (e) {
            this.shape.getStage().setDraggable(false);
            var uiWire = new UIWire(instance, editor);
            editor.setDraggedElement({type: 'wire', ui: uiWire});
            editor.getUI().getWiresLayer().add(uiWire.getShape());
            e.cancelBubble = true;
        }.bind(this));

        this.shape.on('mouseup touchend', function (e) {
            this.shape.getStage().setDraggable(true);
            var draggedElem = editor.getDraggedElement();
            if (draggedElem && draggedElem.ui && draggedElem.type === 'wire' && draggedElem.ui.getSrcInstance().ui instanceof UIPort) {
                function cancelWireDrawing() {
                    draggedElem.ui.getShape().destroy();
                    editor.getUI().getWiresLayer().batchDraw();
                    editor.setDraggedElement(null);
                    e.cancelBubble = true;
                }

                var isOpposite = function () {
                    return (draggedElem.ui.getSrcInstance().ui.isProvided() && !this.isProvided())
                        || (!draggedElem.ui.getSrcInstance().ui.isProvided() && this.isProvided());
                }.bind(this);

                if (isOpposite()) {
                    var chans = ModelHelper.getChannelTypes(editor.getModel());
                    if (chans.length > 0) {
                        var srcPort = draggedElem.ui.getSrcInstance();
                        cancelWireDrawing();
                        this.openBindingModalCmd.execute(srcPort, instance);
                    } else {
                        var alert = new Alert();
                        alert.setType(Alert.WARNING);
                        alert.setText('No channel type found in model');
                        alert.show(3000);
                        cancelWireDrawing();
                    }
                } else {
                    cancelWireDrawing();
                }
            }
        }.bind(this));
    },

    isProvided: function () {
        return this.provided;
    },

    getWidth: function () {
        return this.circle.getRadius()*2;
    },

    getHeight: function () {
        return this.circle.getRadius()*2 + this.text.getHeight();
    },

    getPlugPosition: function () {
        var pos = this.shape.getAbsolutePosition();
        return {
            x: pos.x + RADIUS,
            y: pos.y + RADIUS
        };
    },

    getWireColor: function () {
        if (this.provided) {
            return '#ECCA40';
        } else {
            return '#C60808';
        }
    },

    onDelete: function () {
        for (var i in this.wires) this.wires[i].getShape().remove();
    },

    onRemoveBinding: function (binding) {
        this.removeBindingCmd.execute(binding);
    },

    onAddBinding: function (binding) {
        // add binding is done in UIChannel (no need to do the work twice)
    },

    show: function () {
        this.shape.show();
        for (var i in this.wires) {
            this.wires[i].show();
        }
    },

    hide: function () {
        this.shape.hide();
        for (var i in this.wires) {
            this.wires[i].hide();
        }
    }
});

module.exports = UIPort;
