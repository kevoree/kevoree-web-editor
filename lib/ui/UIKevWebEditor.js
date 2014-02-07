/**
 * Created by leiko on 23/01/14.
 */
var Class                   = require('pseudoclass'),
    ConfImg                 = require('../config/images'),
    ModelHelper             = require('../util/ModelHelper'),
    UITypeDefinitionList    = require('./UITypeDefinitionList'),
    AddNode                 = require('../command/model/AddNode'),
    AddChannel              = require('../command/model/AddChannel'),
    AddGroup                = require('../command/model/AddGroup'),
    AddComponent            = require('../command/model/AddComponent'),
    UIGroup                 = require('../ui/UIGroup'),
    UINode                  = require('../ui/UINode'),
    UIWire                  = require('./UIWire'),
    UIChannel               = require('../ui/UIChannel');

var UIKevWebEditor = Class({
    toString: 'UIKevWebEditor',

    construct: function (ctrl) {
        this.ctrl = ctrl;
        this.uiInstances = {};

        this.addNodeCmd = new AddNode(this.ctrl);
        this.addGroupCmd = new AddGroup(this.ctrl);
        this.addChanCmd = new AddChannel(this.ctrl);
        this.addCompCmd = new AddComponent(this.ctrl);

        var domEditor = $('#editor');
        domEditor.css('top', $('#editor-navbar').outerHeight);

        this.stage = new Kinetic.Stage({
            container: 'editor',
            width: domEditor.width(),
            height: domEditor.height()
        });

        var bgLayer = new Kinetic.Layer();

        var bgImg = new Image();
        bgImg.onload = function() {
            var background = new Kinetic.Image({
                image: bgImg
            });
            background.cache();
            bgLayer.add(background);
            bgLayer.setZIndex(0);
            bgLayer.draw();
        }
        bgImg.src = ConfImg.background;

        this.stage.add(bgLayer);

        this.instancesLayer = new Kinetic.Layer({
            width: this.stage.getWidth(),
            height: this.stage.getHeight()
        });
        this.stage.add(this.instancesLayer);

        this.resizeId = null;
        $(window).on('resize', function () {
            // but do it not each time "resize" event occurs because it would be very laggy
            // so use a little setTimeout and do the resize only if no resize events occured since 100ms
            clearTimeout(this.resizeId);
            this.resizeId = setTimeout(function () {
                this.stage.width(domEditor.width());
                this.stage.height(domEditor.height());
                this.stage.draw();
            }.bind(this), 50);
        }.bind(this));

        domEditor.droppable({
            drop: function (event, ui) {
                var tDefName = ui.draggable.find('.typedef-name').html(),
                    latestVersion = ModelHelper.findLatestVersion(tDefName, this.ctrl.getModel()),
                    tDef = this.ctrl.getModel().findTypeDefinitionsByID(tDefName+'/'+latestVersion),
                    metadata =  {x: event.pageX, y: event.pageY};

                this.addInstance(tDef, null, metadata);

            }.bind(this)
        });

        this.stage.on('mouseup touchend', function () {
            this.endWireCreation();
        }.bind(this));

        this.uiTDefList = new UITypeDefinitionList(this.ctrl);
    },

    /**
     * Called by UIKevWebEditor & UITypeDefinitionList callbacks when an instance needs to be added
     * @param tDef
     * @param instanceName
     * @param metadata
     */
    addInstance: function (tDef, instanceName, metadata) {
        var type = ModelHelper.findTypeDefinitionType(tDef);
        switch (type) {
            case 'group':
                this.addGroupCmd.execute(tDef, instanceName, metadata);
                break;

            case 'node':
                if (this.ctrl.getDroppableContainerNode()) {
                    this.addNodeCmd.execute(tDef, instanceName, metadata, this.ctrl.getDroppableContainerNode());
                    this.ctrl.setDroppableContainerNode();
                } else {
                    this.addNodeCmd.execute(tDef, instanceName, metadata);
                }
                break;

            case 'channel':
                this.addChanCmd.execute(tDef, instanceName, metadata);
                break;

            case 'component':
                if (this.ctrl.getDroppableContainerNode()) {
                    this.addCompCmd.execute(tDef, instanceName, metadata, this.ctrl.getDroppableContainerNode());
                    this.ctrl.setDroppableContainerNode();
                } else {
                    // TODO tell user he can't drop comp in something else than a node
                }
                break;
        }
    },

    removeInstance: function (instancePath) {
        var instanceUI = this.instancesLayer.find('#'+instancePath);
        if (instanceUI) {
            instanceUI.remove();
            instanceUI.destroy();
            this.update();
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given group instance
     * @param instance
     */
    addGroup: function (instance) {
        var uiInstance = this.uiInstances[instance.path()];
        if (uiInstance) {
            uiInstance.update();
        } else {
            var group = new UIGroup(instance, this.ctrl);
            this.instancesLayer.add(group.getShape());
            this.uiInstances[instance.path()] = group;

            var subNodes = instance.subNodes.iterator();
            while (subNodes.hasNext()) {
                var node = subNodes.next();
                var uiWire = new UIWire(instance, this.ctrl, node);
                this.instancesLayer.add(uiWire.getShape());
            }

            this.update();
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given node instance
     * @param instance
     */
    addNode: function (instance) {
        var uiInstance = this.uiInstances[instance.path()];
        if (uiInstance) {
            uiInstance.update();
        } else {
            var node = new UINode(instance, this.ctrl);
            this.instancesLayer.add(node.getShape());
            this.uiInstances[instance.path()] = node;
            this.update();
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given channel instance
     * @param instance
     */
    addChannel: function (instance) {
        var uiInstance = this.uiInstances[instance.path()];
        if (uiInstance) {
            uiInstance.update();
        } else {
            var chan = new UIChannel(instance, this.ctrl);
            this.instancesLayer.add(chan.getShape());
            this.uiInstances[instance.path()] = chan;
            this.update();
        }
    },

    endWireCreation: function () {
        var wire = this.instancesLayer.find('#temp-wire');
        if (wire) {
            wire.remove();
            wire.destroy();
            this.instancesLayer.batchDraw();
        }
    },

    updateTempWire: function () {
        var wire = this.instancesLayer.find('#temp-wire');
        if (wire) this.instancesLayer.batchDraw();
    },

    getUIInstance: function (path) {
        return this.uiInstances[path];
    },

    getStage: function () {
        return this.stage;
    },

    clean: function () {
        this.instancesLayer.destroyChildren();
        this.instancesLayer.draw();
    },

    update: function () {
        var model = this.ctrl.getModel();

        // add node instances
        var nodes = model.nodes.iterator();
        while (nodes.hasNext()) this.addNode(nodes.next());
        // add group instances
        var groups = model.groups.iterator();
        while (groups.hasNext()) this.addGroup(groups.next());
        // add channel instances
        var hubs = model.hubs.iterator();
        while (hubs.hasNext()) this.addChannel(hubs.next());

//        // hack to get mousemove event on the whole stage width/height
//        var rect = new Kinetic.Rect({
//            width: this.stage.getWidth(),
//            height: this.stage.getHeight()
//        });
//        this.instancesLayer.add(rect);
//        rect.on('mousemove touchmove', function () {
//            this.updateTempWire();
//        }.bind(this));

        this.uiTDefList.update();
        this.instancesLayer.batchDraw();

        console.log("update", this.stage);
    }
});

module.exports = UIKevWebEditor;