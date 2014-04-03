/**
 * Created by leiko on 23/01/14.
 */
var Class                   = require('pseudoclass'),
    ModelHelper             = require('../util/ModelHelper'),
    UITypeDefinitionList    = require('./UITypeDefinitionList'),
    AddNode                 = require('../command/model/AddNode'),
    AddChannel              = require('../command/model/AddChannel'),
    AddGroup                = require('../command/model/AddGroup'),
    AddComponent            = require('../command/model/AddComponent'),
    UIGroup                 = require('../ui/UIGroup'),
    UINode                  = require('../ui/UINode'),
    UIWire                  = require('./UIWire'),
    UIChannel               = require('../ui/UIChannel'),
    Alert                   = require('../util/Alert');

var UIKevWebEditor = Class({
    toString: 'UIKevWebEditor',

    construct: function (ctrl) {
        this.ctrl = ctrl;
        this.doUIUpdate = true;

        this.alert = new Alert();

        this.addNodeCmd = new AddNode(this.ctrl);
        this.addGroupCmd = new AddGroup(this.ctrl);
        this.addChanCmd = new AddChannel(this.ctrl);
        this.addCompCmd = new AddComponent(this.ctrl);

        var domEditor = $('#editor');
        domEditor.css('top', $('#editor-navbar').outerHeight);

        var bgLayer = new Kinetic.Layer();
        
        var bgImg = new Image();
        bgImg.onload = function() {
            this.stage = new Kinetic.Stage({
                container: 'editor',
                width: domEditor.width(),
                height: domEditor.height(),
                draggable: true,
                dragBoundFunc: function(pos) {
                    var scale = this.stage.scale(),
                        minX = (domEditor.width() - bgImg.width * scale.x),
                        minY = (domEditor.height() - bgImg.height * scale.y);
                    
                    if      (pos.x > 0)     pos.x = 0;
                    else if (pos.x < minX)  pos.x = minX;

                    if      (pos.y > 0)     pos.y = 0;
                    else if (pos.y < minY)  pos.y = minY;
                    
                    return pos;
                }.bind(this)
            });

            var background = new Kinetic.Image({
                image: bgImg
            });
            bgLayer.add(background);

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
                this.stage.width(domEditor.width());
                this.stage.height(domEditor.height());
                this.uiTDefList.update();
                this.stage.batchDraw();
            }.bind(this));

            this.stage.on('mouseup touchend', function () {
                if (ctrl.getDraggedElement()) {
                    if (ctrl.getDraggedElement().type === 'wire') {
                        ctrl.setDraggedElement(null);
                    }
                }
            }.bind(this));

            function resetListener(e) {
                // reset zoom to 100%
                this.stage.scale({x: 1, y: 1});
                // reset position
                this.stage.position({x: 0, y: 0});
                this.stage.batchDraw();
            }
            
            this.stage.on('dblclick dbltap', resetListener.bind(this));
            background.on('dblclick dbltap', resetListener.bind(this));

            this.uiTDefList = new UITypeDefinitionList(this.ctrl);
        }.bind(this);
        bgImg.src = "images/background.jpg";
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
                    this.alert.hide();
                    this.addCompCmd.execute(tDef, instanceName, metadata, this.ctrl.getDroppableContainerNode());
                    this.ctrl.setDroppableContainerNode();
                } else {
                    this.alert.setType('warning');
                    this.alert.setText('Unable to add component', 'Components must be dropped into node instances');
                    this.alert.show(10000);
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
        console.log('REMOVE UI', instancePath, destroy);
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
        if (this.doUIUpdate) {
            var model = this.ctrl.getModel();

            // add node instances
            var nodes = model.nodes.iterator();
            while (nodes.hasNext()) {
                this.addNode(nodes.next());
            }
            // add group instances
            var groups = model.groups.iterator();
            while (groups.hasNext()) {
                this.addGroup(groups.next());
            }
            // add channel instances
            var hubs = model.hubs.iterator();
            while (hubs.hasNext()) {
                this.addChannel(hubs.next());
            }

            this.uiTDefList.update();
            this.instancesLayer.batchDraw();
            this.wiresLayer.batchDraw();

            console.log("update", this.stage);
        }
    },

    cancelUIUpdates: function () {
        this.doUIUpdate = false;
    },

    enableUIUpdates: function () {
        this.doUIUpdate = true;
    },

    showLoadingLayer: function () {
        $('#loading-layer').removeClass('hide');
    },

    hideLoadingLayer: function () {
        $('#loading-layer').addClass('hide');
    }
});

module.exports = UIKevWebEditor;