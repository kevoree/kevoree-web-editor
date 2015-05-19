var Class                = require('pseudoclass'),
    EntityEventProcessor = require('../engine/EntityEventProcessor'),
    Config               = require('../config/defaults'),
    kevoree              = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 27/01/14.
 */
var AbstractEntity = Class({
    toString: 'AbstractEntity',

    construct: function (instance, editor) {
        this.instance = instance;
        this.instance.ui = this;
        this.editor = editor;
        this.wires = [];
        this.isVisible = true;
        this.isSelected = false;

        this.eventProcessor = new EntityEventProcessor(editor, this);
        this.instance.addModelElementListener(this.eventProcessor.processor());

        var editorAttrs = editor.getUI().stage.attrs;

        this.metadata = {
            x: Math.floor(Math.random() * (editorAttrs.width - 550)) + 350,
            y: Math.floor(Math.random() * (editorAttrs.height - 300)) + 100
        }; // default metadata
        var position = (instance.findMetaDataByID) ? instance.findMetaDataByID(Config.META_POSITION) : null;
        if (position) {
            try {
                this.metadata = JSON.parse(position.value);
            } catch (ignore) {}
        } else {
            try {
                var factory = new kevoree.factory.DefaultKevoreeFactory();
                position = factory.createValue();
                position.name = Config.META_POSITION;
                position.value = JSON.stringify(this.metadata);
                instance.addMetaData(position);
            } catch (ignore) {}
        }

        this.shape = new Kinetic.Group({
            id: instance.path(),
            x: this.metadata.x,
            y: this.metadata.y,
            draggable: true
        });

        this.shape.on('click', function (e) {
            if (e.evt.ctrlKey) {
                // CTRL key was pressed during click => select shape
                this.isSelected = !this.isSelected;
                this.setSelected(this.isSelected);
                e.cancelBubble = true;

            } else {
                if (this.openPropsCmd && (typeof (this.openPropsCmd.execute) === 'function')) {
                    this.openPropsCmd.execute(instance);
                    e.cancelBubble = true;
                }
            }
        }.bind(this));

        this.shape.on('dragend.absentity', function () {
            var position = this.instance.findMetaDataByID(Config.META_POSITION);
            if (!position) {
                var factory = new kevoree.factory.DefaultKevoreeFactory();
                position = factory.createValue();
                position.name = Config.META_POSITION;
                this.instance.addMetaData(position);
            }
            position.value = JSON.stringify(this.shape.getAbsolutePosition());
        }.bind(this));
        
        this.shape.on('mouseover.absentity touchstart.absentity', function () {
            document.body.style.cursor = 'pointer';
            if (editor.getDraggedElement()) {
                if (editor.getDraggedElement().type === 'wire') {
                    editor.getUI().getWiresLayer().batchDraw();
                }
            }
        });

        this.shape.on('mouseout.absentity touchend.absentity', function () {
            document.body.style.cursor = 'default';
        });
    },

    update: function () {
        if (this.shape.getLayer()) {
            this.shape.id(this.instance.path());
            this.text.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            this.text.fill((this.instance.started) ? '#fff' : 'black');
            this.shape.getLayer().batchDraw();
        }
    },

    /**
     * Called when user asked for a deletion of this instance
     */
    onDelete: function () {
        console.log('onDelete', this.instance.name);
        for (var i in this.wires) this.wires[i].getShape().remove();
        this.deleteCmd.execute(this.instance);
    },
    
    setName: function (name) {
        this.text.text(name + '\n' + this.instance.typeDefinition.name);
        this.shape.getLayer().batchDraw();
    },

    getShape: function () {
        return this.shape;
    },
    
    getWireColor: function () {
        return '#5aa564';
    },

    onRemove: function (path) {
        this.shape.remove();
        for (var i=0; i < this.wires.length; i++) {
            this.wires[i].getShape().remove();
        }
        this.editor.getUI().batchDraw();
    },

    onSet: function (attrName, sourcePath, previousVal, value) {
        console.log('onSet', this.instance.name, attrName, sourcePath, previousVal, value);
        if (typeof(value) !== 'undefined' && value != null) this.update();
    },
    
    onAdd: function (instance) {},
    
    addWire: function (wireUI) {
        var index = this.wires.indexOf(wireUI);
        if (index === -1) {
            this.wires.push(wireUI);
        }
    },

    removeWire: function (wireUI) {
        var index = this.wires.indexOf(wireUI);
        if (index !== -1) {
            this.wires.splice(index, 1);
        }
    },

    setSelected: function (boolean) {},

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

module.exports = AbstractEntity;