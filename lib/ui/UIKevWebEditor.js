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
//        this.uiInstances = {};

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
        var moveRect = new Kinetic.Rect({
            width: this.stage.getWidth(),
            height: this.stage.getHeight()
        });
        bgLayer.add(moveRect);

        this.stage.add(bgLayer);

        this.instancesLayer = new Kinetic.Layer({
            width: this.stage.getWidth(),
            height: this.stage.getHeight()
        });
        this.stage.add(this.instancesLayer);
        
        this.wiresLayer = new Kinetic.Layer({
            width: this.stage.getWidth(),
            height: this.stage.getHeight()
        });
        this.stage.add(this.wiresLayer);

        moveRect.on('mousemove', function (e) {
            if (ctrl.getDraggedElement()) {
                if (ctrl.getDraggedElement().type === 'wire') {
                    this.wiresLayer.batchDraw();
                }
            }
        }.bind(this));

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
            if (ctrl.getDraggedElement()) {
                if (ctrl.getDraggedElement().type === 'wire') {
                    ctrl.setDraggedElement(null);
                }
            }
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

    /**
     * 
     * @param instancePath
     * @param destroy tells whether or not you want to just remove the shape from its container
     *                or you want to completely destroy it
     */
    removeUIInstance: function (instancePath, destroy) {
        var instanceUI = this.instancesLayer.find('#'+instancePath);
        if (instanceUI) {
            if (destroy) {
                instanceUI.destroy();
            } else {
                instanceUI.remove();
            }
            this.update();
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given group instance
     * @param instance
     */
    addGroup: function (instance) {
        if (instance.ui) {
            instance.ui.update();
        } else {
            var group = new UIGroup(instance, this.ctrl);
            this.instancesLayer.add(group.getShape());
            this.update();
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given node instance
     * @param instance
     */
    addNode: function (instance) {
        if (!instance.host) {
            // just add top-level nodes here. Hosted nodes will be added by their respective host UI
            if (instance.ui) {
                instance.ui.update();
            } else {
                var node = new UINode(instance, this.ctrl);
                this.instancesLayer.add(node.getShape());
                this.update();
            }
        }
    },

    /**
     * Called by KevWebEditor controller, in order to add an UI to given channel instance
     * @param instance
     */
    addChannel: function (instance) {
        if (instance.ui) {
            instance.ui.update();
        } else {
            var chan = new UIChannel(instance, this.ctrl);
            this.instancesLayer.add(chan.getShape());
            this.update();
        }
    },

    getStage: function () {
        return this.stage;
    },
    
    getInstancesLayer: function () {
        return this.instancesLayer;
    },
    
    getWiresLayer: function () {
        return this.wiresLayer;
    },

    clean: function () {
        // TODO clean all "ui" props from instances
        this.instancesLayer.destroyChildren();
        this.instancesLayer.draw();
        
        this.wiresLayer.destroyChildren();
        this.wiresLayer.draw();
        
        this.uiTDefList.update();
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

        this.uiTDefList.update();
        this.instancesLayer.batchDraw();
        this.wiresLayer.batchDraw();
        
        console.log("update", this.stage);
    }
});

module.exports = UIKevWebEditor;