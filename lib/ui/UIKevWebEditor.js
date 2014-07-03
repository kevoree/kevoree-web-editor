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
    Alert                   = require('../util/Alert'),
    LocalStorage            = require('../util/LocalStorageHelper'),
    LSKeys                  = require('../config/local-storage-keys'),
    Defaults                = require('../config/defaults');

var ZOOM = 0.1;

var UIKevWebEditor = Class({
    toString: 'UIKevWebEditor',

    init: function () {
        window.onbeforeunload = function (e) {
            var askBeforeLeaving = LocalStorage.get(LSKeys.ASK_BEFORE_LEAVING, Defaults.ASK_BEFORE_LEAVING);
            if (askBeforeLeaving) {
                var message = "Any unsaved model will be lost";
                e = e || window.event;

                // For IE and Firefox prior to version 4
                if (e) {
                    e.returnValue = message;
                }
                // For Safari
                return message;
            }
        };
    },

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

                    if (pos.x > 0) {
                        pos.x = 0;
                    } else if (pos.x < minX) {
                        pos.x = minX;
                    }

                    if (pos.y > 0) {
                        pos.y = 0;
                    } else if (pos.y < minY) {
                        pos.y = minY;
                    }

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

            domEditor.on('mousewheel', function (e) {
                var scale = this.stage.scale();
                var stagePos = this.stage.getPosition();
                var scalefactor = {
                    x: domEditor.width() / (bgImg.width + stagePos.x),
                    y: domEditor.height() / (bgImg.height + stagePos.y)
                };

                var newscale;
                if(e.originalEvent.wheelDelta/120 > 0) {
                    newscale = {x: scale.x+ZOOM, y: scale.y+ZOOM};
                } else {
                    newscale = {x: scale.x-ZOOM, y: scale.y-ZOOM};
                }

                if (newscale.x > scalefactor.x && newscale.y > scalefactor.y) {
                    this.stage.scale(newscale);
                    this.stage.batchDraw();
                    this.alert.hide();
                } else {
                    this.alert.setType('warning');
                    this.alert.setText('Maximum zoom out');
                    this.alert.show(1500);
                }

            }.bind(this));

            var resetListener = function () {
                // reset zoom to 100%
                this.stage.scale({x: 1, y: 1});
                // reset position
                this.stage.position({x: 0, y: 0});
                this.stage.batchDraw();
            }.bind(this);

            this.stage.on('dblclick dbltap', resetListener);
            background.on('dblclick dbltap', resetListener);

            this.uiTDefList = new UITypeDefinitionList(this.ctrl);
        }.bind(this);
        bgImg.src = "images/background.jpg";

        this.domInstToggleNodes     = $('#instance-toggle-nodes');
        this.domInstToggleSubNodes  = $('#instance-toggle-subnodes');
        this.domInstToggleGroups    = $('#instance-toggle-groups');
        this.domInstToggleChans     = $('#instance-toggle-chans');
        this.domInstToggleComps     = $('#instance-toggle-comps');

        this.nodeToggle     = true;
        this.subNodeToggle  = true;
        this.groupToggle    = true;
        this.chanToggle     = true;
        this.compToggle     = true;

        function toggleEyeIcon(item) {
            var icon = item.find('span');
            if (icon.hasClass('glyphicon-eye-open')) {
                icon.removeClass('glyphicon-eye-open');
                icon.addClass('glyphicon-eye-close');
            } else {
                icon.addClass('glyphicon-eye-open');
                icon.removeClass('glyphicon-eye-close');
            }
        }

        this.domInstToggleNodes.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.nodeToggle = !this.nodeToggle;
            e.preventDefault();
            this.update();
            return false;
        }.bind(this));

        this.domInstToggleGroups.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.groupToggle = !this.groupToggle;
            e.preventDefault();
            this.update();
            return false;
        }.bind(this));

        this.domInstToggleChans.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.chanToggle = !this.chanToggle;
            e.preventDefault();
            this.update();
            return false;
        }.bind(this));

        this.domInstToggleSubNodes.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.subNodeToggle = !this.subNodeToggle;
            e.preventDefault();
            this.update();
            return false;
        }.bind(this));

        this.domInstToggleComps.on('click', function (e) {
            toggleEyeIcon($(e.currentTarget));
            this.compToggle = !this.compToggle;
            e.preventDefault();
            this.update();
            return false;
        }.bind(this));
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
            this.instancesLayer.batchDraw();
            this.uiTDefList.update();
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
                this.instancesLayer.batchDraw();
                this.uiTDefList.update();
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
            this.instancesLayer.batchDraw();
            this.uiTDefList.update();
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

    batchDraw: function () {
        this.instancesLayer.batchDraw();
        this.wiresLayer.batchDraw();
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