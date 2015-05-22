'use strict';

angular.module('editorApp')
    .factory('uiFactory', function () {
        var x = 100,
            y = 100,
            GROUP_RADIUS = 55,
            GROUP_PLUG_RADIUS = 10,
            NODE_WIDTH = 180,
            NODE_HEIGHT = 50,
            COMPONENT_WIDTH = 160,
            COMPONENT_HEIGHT = 40,
            CHANNEL_RADIUS = 45;
        
        var factory = {
            /**
             * Should be called only one time to init the Editor panel
             */
            init: function () {
                var editor = this.editor = new Snap('svg#editor');
                editor.mousedown(function () {
                    editor.selectAll('.instance .bg').forEach(function (elem) {
                        elem.removeClass('selected');
                    });
                    if (factory.listener) {
                        factory.listener();
                    }
                });
            },

            /**
             *
             * @param elem
             * @returns {*}
             */
            createGroup: function (elem) {
                var bg = this.editor
                    .circle(x, y, GROUP_RADIUS)
                    .attr({
                        fill: 'green',
                        stroke: '#000',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                if (!document.getElementById('group-clip')) {
                    var editor = document.getElementById('editor');
                    var defs = editor.getElementsByTagName('defs')[0];
                    var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'group-clip';
                    var bgClone = bg.node.cloneNode(true);
                    bgClone.setAttribute('r', (GROUP_RADIUS-4)+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var plug = this.editor
                    .circle(x, (GROUP_RADIUS/2)+y+GROUP_PLUG_RADIUS, GROUP_PLUG_RADIUS)
                    .attr({
                        fill: '#f1c30f',
                        'class': 'group-plug'
                    });
                plug.mouseover(function () {
                    plug.attr({r: GROUP_PLUG_RADIUS+1});
                });
                plug.mouseout(function () {
                    plug.attr({r: GROUP_PLUG_RADIUS});
                });

                var nameText = this.editor
                    .text(x, y-5, elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#group-clip)'
                    });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#group-clip)'
                    });

                return this.editor
                    .group()
                    .attr({ 'class': 'instance group', 'data-path': elem.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .append(plug)
                    .mousedown(mouseDownHandler)
                    .touchstart(startHandler)
                    .touchend(stopHandler)
                    .touchmove(moveHandler)
                    .drag(moveHandler, startHandler, stopHandler);
            },

            createNode: function (elem) {
                var bg = this.editor
                    .rect(x, y, NODE_WIDTH, NODE_HEIGHT, 8)
                    .attr({
                        fill: 'white',
                        fillOpacity: 0.1,
                        stroke: 'white',
                        strokeWidth: 2,
                        'class': 'bg'
                    });

                if (!document.getElementById('node-clip')) {
                    var editor = document.getElementById('editor');
                    var defs = editor.getElementsByTagName('defs')[0];
                    var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'node-clip';
                    var bgClone = bg.node.cloneNode(true);
                    bgClone.setAttribute('width', (NODE_WIDTH-5)+'');
                    bgClone.setAttribute('x', (x+2)+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x+(NODE_WIDTH/2), y+(NODE_HEIGHT/2), elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#node-clip)'
                    });

                var tdefText = this.editor
                    .text(x+(NODE_WIDTH/2), y+(NODE_HEIGHT/2)+12, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#node-clip)'
                    });

                var node = this.editor
                    .group()
                    .attr({'class': 'instance node', 'data-path': elem.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchstart(startHandler)
                    .touchend(stopHandler)
                    .touchmove(moveHandler)
                    .mouseover(mouseOverNodeHandler)
                    .drag(moveHandler, startHandler, stopHandler);

                for (var i=0; i < elem.components.array.length; i++) {
                    var comp = factory.createComponent(elem.components.array[i]);
                    var dx = (NODE_WIDTH-COMPONENT_WIDTH)/ 2,
                        dy = (COMPONENT_HEIGHT+10)*(i+1);
                    comp.transform('t'+dx+','+dy);
                    node.append(comp);
                }

                bg.attr({ height: NODE_HEIGHT + (elem.components.array.length*(COMPONENT_HEIGHT+10)) + 5 });

                return node;
            },

            createChannel: function (elem) {
                var bg = this.editor
                    .circle(x, y, CHANNEL_RADIUS)
                    .attr({
                        fill: '#d57129',
                        stroke: '#fff',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                if (!document.getElementById('chan-clip')) {
                    var editor = document.getElementById('editor');
                    var defs = editor.getElementsByTagName('defs')[0];
                    var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'chan-clip';
                    var bgClone = bg.node.cloneNode(true);
                    bgClone.setAttribute('r', (CHANNEL_RADIUS-4)+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x, y-5, elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#chan-clip)'
                    });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#chan-clip)'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance chan', 'data-path': elem.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchstart(startHandler)
                    .touchend(stopHandler)
                    .touchmove(moveHandler)
                    .drag(moveHandler, startHandler, stopHandler);
            },

            createComponent: function (elem) {
                var bg = this.editor
                    .rect(x, y, COMPONENT_WIDTH, COMPONENT_HEIGHT, 3)
                    .attr({
                        fill: 'black',
                        fillOpacity: 0.75,
                        stroke: 'white',
                        strokeWidth: 1.5,
                        'class': 'bg'
                    });

                if (!document.getElementById('comp-clip')) {
                    var editor = document.getElementById('editor');
                    var defs = editor.getElementsByTagName('defs')[0];
                    var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'comp-clip';
                    var bgClone = bg.node.cloneNode(true);
                    bgClone.setAttribute('width', (COMPONENT_WIDTH-5)+'');
                    bgClone.setAttribute('x', (x+2)+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x+(COMPONENT_WIDTH/2), y+(COMPONENT_HEIGHT/2), elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#comp-clip)'
                    });

                var tdefText = this.editor
                    .text(x+(COMPONENT_WIDTH/2), y+(COMPONENT_HEIGHT/2)+12, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#comp-clip)'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance comp', 'data-path': elem.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchstart(startHandler)
                    .touchend(stopHandler)
                    .touchmove(moveHandler)
                    .mouseover(mouseOverNodeHandler)
                    .drag(moveHandler, startHandler, stopHandler);
            },

            deleteInstance: function (path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    elem.remove();
                }
                if (this.listener) {
                    var selected = this.editor.select('.selected');
                    if (selected) {
                        this.listener(selected.parent().attr('data-path'));
                    } else {
                        this.listener(null);
                    }
                }
            },

            updateInstance: function (previousPath, instance) {
                var elem = this.editor.select('.instance[data-path="'+previousPath+'"]');
                if (elem) {
                    elem.attr({ 'data-path': instance.path() });
                    elem.select('text.name').attr({
                        text: instance.name
                    });
                }
            },

            getSelected: function () {
                return this.editor.selectAll('.selected').items.map(function (elem) {
                    return elem.parent().attr('data-path');
                });
            },

            setSelectedListener: function (listener) {
                this.listener = listener;
            }
        };

        var moveHandler = function (dx, dy) {
            var clientX, clientY;
            if( (typeof dx === 'object') && ( dx.type === 'touchmove') ) {
                clientX = dx.changedTouches[0].clientX;
                clientY = dx.changedTouches[0].clientY;
                dx = clientX - this.data('ox');
                dy = clientY - this.data('oy');
            }
            this.attr({
                transform: this.data('origTransform') + (this.data('origTransform') ? 'T' : 't') + [dx, dy]
            });
        };

        var startHandler = function (dx) {
            if((typeof dx === 'object') && ( dx.type === 'touchstart')) {
                mouseDownHandler.call(this, dx); // select instance on touch event
                dx.preventDefault();
                this.data('ox', dx.changedTouches[0].clientX );
                this.data('oy', dx.changedTouches[0].clientY );
            }
            this.data('origTransform', this.transform().local );
            //kEditor.setDraggedElem({
            //    instance: kEditor.getModel().findByPath(this.attr('data-path')),
            //    isNew: false
            //});
        };

        var stopHandler = function () {
            //kEditor.setDraggedElem(null);
        };

        var mouseDownHandler = function (evt) {
            if (!evt.ctrlKey && !evt.shiftKey) {
                factory.editor.selectAll('.bg').forEach(function (elem) {
                    elem.removeClass('selected');
                });
            }
            this.select('.bg').addClass('selected');
            evt.cancelBubble = true;
            if (factory.listener) {
                factory.listener(this.attr('data-path'));
            }
        };

        var mouseOverNodeHandler = function () {
            console.log('mouse over node', this.attr('data-path'));
        };

        return factory;
    });