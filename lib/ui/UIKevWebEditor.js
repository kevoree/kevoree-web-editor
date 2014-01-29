/**
 * Created by leiko on 23/01/14.
 */
var Class = require('pseudoclass');
var ConfImg = require('../config/images');
var ModelHelper = require('../util/ModelHelper');
var UITypeDefinitionList = require('./UITypeDefinitionList');
var AddInstance = require('../command/model/AddInstance');
var UIGroup = require('../ui/UIGroup');
var UINode = require('../ui/UINode');
var UIChannel = require('../ui/UIChannel');

var UIKevWebEditor = Class({
    toString: 'UIKevWebEditor',

    construct: function (ctrl) {
        this.ctrl = ctrl;
        this.uiInstances = {};

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

        this.instancesLayer = new Kinetic.Layer();
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

        var addInstanceCmd = new AddInstance();
        domEditor.droppable({
            drop: function (event, ui) {
                console.log("drop");
                var tDefName = ui.draggable.find('.typedef-name').html();
                addInstanceCmd.execute(null, null, tDefName, ModelHelper.findLatestVersion(tDefName, this.ctrl.getModel()), this.ctrl, {x: event.pageX, y: event.pageY});

            }.bind(this)
        });

        this.uiTDefList = new UITypeDefinitionList(this.ctrl);
    },

    addGroup: function (instance) {
        if (!this.uiInstances[instance.path()]) {
            var group = new UIGroup(instance, this.ctrl);
            this.instancesLayer.add(group.getShape());
            this.uiInstances[instance.path()] = group;
            this.instancesLayer.batchDraw();
        } else {
            this.uiInstances[instance.path()].update();
        }
    },

    addNode: function (instance) {
        if (!this.uiInstances[instance.path()]) {
            var node = new UINode(instance, this.ctrl);
            this.instancesLayer.add(node.getShape());
            this.uiInstances[instance.path()] = node;
            this.instancesLayer.batchDraw();
        } else {
            this.uiInstances[instance.path()].update();
        }
    },

    addChannel: function (instance) {
        if (!this.uiInstances[instance.path()]) {
            var chan = new UIChannel(instance, this.ctrl);
            this.instancesLayer.add(chan.getShape());
            this.uiInstances[instance.path()] = chan;
            this.instancesLayer.batchDraw();
        } else {
            this.uiInstances[instance.path()].update();
        }
    },

    update: function () {
        var model = this.ctrl.getModel();

        var nodes = model.nodes.iterator();
        while (nodes.hasNext()) this.addNode(nodes.next());
        var groups = model.groups.iterator();
        while (groups.hasNext()) this.addGroup(groups.next());
        var hubs = model.hubs.iterator();
        while (hubs.hasNext()) this.addChannel(hubs.next());

        this.uiTDefList.update();
        this.instancesLayer.batchDraw();

        console.log("update", this.stage);
    }
});

module.exports = UIKevWebEditor;