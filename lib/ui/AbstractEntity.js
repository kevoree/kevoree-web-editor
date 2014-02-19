var Class               = require('pseudoclass'),
    EntityEventProcessor = require('../engine/EntityEventProcessor');

/**
 * Created by leiko on 27/01/14.
 */
var AbstractEntity = Class({
    toString: 'AbstractEntity',

    construct: function (instance, editor) {
        this.instance = instance;
        this.instance.ui = this;
        this.editor = editor;
        
        var eventProcessor = new EntityEventProcessor(editor, this);
        this.instance.addModelElementListener(eventProcessor.processor());

        this.metadata = {x: 350, y: 100}; // default metadata
        if (instance.metaData && instance.metaData != null) {
            try {
                this.metadata = JSON.parse(instance.metaData);
            } catch (ignore) {}
        }

        this.shape = new Kinetic.Group({
            id: instance.path(),
            x: this.metadata.x,
            y: this.metadata.y,
            draggable: true
        });

        this.shape.on('dragend.absentity', function () {
            this.instance.metaData = JSON.stringify(this.shape.getAbsolutePosition());
        }.bind(this));
        
        this.shape.on('mouseover.absentity touchstart.absentity', function () {
            document.body.style.cursor = 'pointer';
        });

        this.shape.on('mouseout.absentity touchend.absentity', function () {
            document.body.style.cursor = 'default';
        });
    },

    update: function () {
        if (this.shape.getLayer()) {
            this.shape.id(this.instance.path());
            console.log('AbstractEntity update', this);
            this.text.text(this.instance.name + '\n' + this.instance.typeDefinition.name);
            this.shape.getLayer().batchDraw();
        }
    },

    /**
     * Called when user asked for a deletion of this instance
     */
    onDelete: function () {
        console.log('onDelete', this.instance.name);
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
        var layer = this.shape.getLayer();
        this.shape.remove();
        layer.batchDraw();
    },

    onSet: function (sourcePath, attrName, value) {
        console.log('onSet', this.instance.name+'(old: '+sourcePath+'): ', attrName+'= '+value);
        this.update();
    },
    onAdd: function (instance) {}
});

module.exports = AbstractEntity;