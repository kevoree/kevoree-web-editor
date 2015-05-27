'use strict';

angular.module('editorApp')
    .factory('uiFactory', function (kFactory) {
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
             * Current editor model
             */
            model: null,

            /**
             * Overed instance (node)
             */
            overedInstancePath: null,

            /**
             * Dragged instance path
             */
            draggedInstancePath: null,

            /**
             * Must be called before any other methods
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
             * @param instance
             * @returns {*}
             */
            createGroup: function (instance) {
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
                    var bgClone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    bgClone.setAttribute('cx', x+'');
                    bgClone.setAttribute('cy', y+'');
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
                    .text(x, y-5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#group-clip)'
                    });

                var tdefText = this.editor
                    .text(x, y+10, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#group-clip)'
                    });

                return this.editor
                    .group()
                    .attr({ 'class': 'instance group', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .append(plug)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable();
            },

            createNode: function (instance) {
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
                    var bgClone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bgClone.setAttribute('width', (NODE_WIDTH-5)+'');
                    bgClone.setAttribute('height', NODE_HEIGHT+'');
                    bgClone.setAttribute('x', (x+2)+'');
                    bgClone.setAttribute('y', y+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x+(NODE_WIDTH/2), y+(NODE_HEIGHT/2), instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#node-clip)'
                    });

                var tdefText = this.editor
                    .text(x+(NODE_WIDTH/2), y+(NODE_HEIGHT/2)+12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#node-clip)'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance node', 'data-path': instance.path()})
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable();
            },

            createChannel: function (instance) {
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
                    var bgClone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    bgClone.setAttribute('cx', x+'');
                    bgClone.setAttribute('cy', y+'');
                    bgClone.setAttribute('r', (CHANNEL_RADIUS-4)+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x, y-5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#chan-clip)'
                    });

                var tdefText = this.editor
                    .text(x, y+10, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#chan-clip)'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance chan', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable();
            },

            createComponent: function (instance) {
                var bg = this.editor
                    .rect(x, y, COMPONENT_WIDTH, COMPONENT_HEIGHT, 3)
                    .attr({
                        fill: 'black',
                        fillOpacity: isTruish(instance.started) ? 1 : 0.65,
                        stroke: 'white',
                        strokeWidth: 1.5,
                        'class': 'bg'
                    });

                if (!document.getElementById('comp-clip')) {
                    var editor = document.getElementById('editor');
                    var defs = editor.getElementsByTagName('defs')[0];
                    var clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'comp-clip';
                    var bgClone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bgClone.setAttribute('width', (COMPONENT_WIDTH-5)+'');
                    bgClone.setAttribute('height', COMPONENT_HEIGHT+'');
                    bgClone.setAttribute('x', (x+2)+'');
                    bgClone.setAttribute('y', y+'');
                    clipPath.appendChild(bgClone);
                    defs.appendChild(clipPath);
                }

                var nameText = this.editor
                    .text(x+(COMPONENT_WIDTH/2), y+(COMPONENT_HEIGHT/2), instance.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#comp-clip)'
                    });

                var tdefText = this.editor
                    .text(x+(COMPONENT_WIDTH/2), y+(COMPONENT_HEIGHT/2)+12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#comp-clip)'
                    });

                var hasMoved = false,
                    parentNode = instance.eContainer();

                var comp = this.editor
                    .group()
                    .attr({'class': 'instance comp', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable()
                    .dragMove(function () {
                        if (!hasMoved) {
                            console.log('removed '+instance.name+' from '+parentNode.name);
                            parentNode.removeComponents(instance);
                        }
                        hasMoved = true;
                    })
                    .dragEnd(function (evt) {
                        if (hasMoved) {
                            var found = false;
                            var nodes = factory.editor.selectAll('.instance.node').items;
                            for (var i=0; i < nodes.length; i++) {
                                console.log(nodes[i].attr('data-path'), nodes[i].getBBox(), evt.offsetX, evt.offsetY);
                                if (Snap.path.isPointInsideBBox(nodes[i].getBBox(), evt.offsetX, evt.offsetY)) {
                                    console.log('intersect with ', nodes[i].attr('data-path'));
                                    comp.remove();
                                    factory.model.findByPath(nodes[i].attr('data-path')).addComponents(instance);
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                // if dropped in "nothing" then put it back into its old host node
                                comp.remove();
                                parentNode.addComponents(instance);
                            }
                            parentNode = null;
                            hasMoved = false;
                        }
                    }
                );

                var host = this.editor.select('.instance[data-path="'+instance.eContainer().path()+'"]');
                var nbComp = host.selectAll('g > .comp').items.length;
                var dx = (NODE_WIDTH-COMPONENT_WIDTH)/ 2,
                    dy = (COMPONENT_HEIGHT+10)*(nbComp+1);
                comp.transform('t'+dx+','+dy);
                host.append(comp);
                host.select('.bg').attr({
                    height: NODE_HEIGHT + ((nbComp+1)*(COMPONENT_HEIGHT+10))
                });

                return comp;
            },

            deleteInstance: function (parent, path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    if (elem.hasClass('comp') || elem.hasClass('node')) {
                        // update node instance graphically
                        this.updateNodeInstance(parent);
                        if (factory.draggedInstancePath === path) {
                            // get elem parent in DOM
                            var parentElem = elem.parent();

                            // remove elem from DOM
                            elem.remove();

                            // append it to the editor
                            this.editor.append(elem);

                            var localTransMatrix = parentElem.transform().localMatrix,
                                elemTransMatrix = elem.transform().localMatrix,
                                dx = localTransMatrix.e + elemTransMatrix.e,
                                dy = localTransMatrix.f + elemTransMatrix.f;
                            elem.data('ot', 't'+dx+','+dy);
                        } else {
                            elem.remove();
                        }
                    } else {
                        elem.remove();
                    }
                }
                invokeListener();
            },

            deleteNodes: function () {
                this.editor.selectAll('.node').remove();
                invokeListener();
            },

            deleteGroups: function () {
                this.editor.selectAll('.group').remove();
                invokeListener();
            },

            deleteChannels: function () {
                this.editor.selectAll('.chan').remove();
                invokeListener();
            },

            deleteBindings: function () {
                this.editor.selectAll('.binding').remove();
                invokeListener();
            },

            updateInstance: function (previousPath, instance) {
                var elem = this.editor.select('.instance[data-path="'+previousPath+'"]');
                if (elem) {
                    elem.attr({ 'data-path': instance.path() });
                    elem.select('text.name').attr({
                        text: instance.name
                    });
                    if (elem.hasClass('comp')) {
                        elem.select('.bg').attr({ fillOpacity: isTruish(instance.started) ? 1 : 0.65 });
                    } else {
                        elem.select('text.name')
                            .attr({
                                fill: isTruish(instance.started) ? '#fff' : '#000'
                            });
                    }
                }
            },

            updateNodeInstance: function (node) {
                var host = this.editor.select('.instance[data-path="'+node.path()+'"]');
                if (host) {
                    for (var i=0; i < node.components.array.length; i++) {
                        var dx = (NODE_WIDTH-COMPONENT_WIDTH)/ 2,
                            dy = (COMPONENT_HEIGHT+10)*(i+1);
                        this.editor
                            .select('.instance[data-path="'+node.components.array[i].path()+'"]')
                            .transform('t'+dx+','+dy);
                    }

                    host.select('.bg').attr({
                        height: NODE_HEIGHT + (node.components.array.length*(COMPONENT_HEIGHT+10))
                    });
                }
            },

            getSelected: function () {
                return this.editor.selectAll('.selected').items.map(function (elem) {
                    return elem.parent().attr('data-path');
                });
            },

            getNodePathAtPoint: function (x, y) {
                var container = document.getElementById('editor-container');
                var elems = this.editor.selectAll('.node').items;
                for (var i=0; i < elems.length; i++) {
                    if (Snap.path.isPointInsideBBox(elems[i].getBBox(), x-container.offsetLeft, y-container.offsetTop)) {
                        return elems[i].attr('data-path');
                    }
                }
                return null;
            },

            setSelectedListener: function (listener) {
                this.listener = listener;
            },

            setModel: function (model) {
                this.model = model;
                this.editor.selectAll('.instance').remove();
            }
        };

        Snap.plugin(function (Snap, Element) {
            var dragStart = function (dx) {
                factory.draggedInstancePath = this.attr('data-path');

                var fn = this.data('dragStart');
                if (fn) {
                    fn.apply(this, arguments)
                }
                if((typeof dx === 'object') && ( dx.type === 'touchstart')) {
                    mouseDownHandler.call(this, dx); // select instance on touch event
                    dx.preventDefault();
                    this.data('ox', dx.changedTouches[0].clientX);
                    this.data('oy', dx.changedTouches[0].clientY);
                }
                this.data('ot', this.transform().local );
            };

            var dragMove = function (dx, dy) {
                var fn = this.data('dragMove');
                if (fn) {
                    fn.apply(this, arguments)
                }

                if((typeof dx === 'object') && ( dx.type === 'touchmove')) {
                    dy = dx.changedTouches[0].clientY - this.data('oy');
                    dx = dx.changedTouches[0].clientX - this.data('ox');
                }

                this.transform(
                    this.data('ot')
                    + (this.data('ot') ? 'T':'t')
                    + [ dx, dy ]);
            };

            var dragEnd = function () {
                var fn = this.data('dragEnd');
                if (fn) {
                    fn.apply(this, arguments)
                }
                factory.draggedInstancePath = null;
            };

            Element.prototype.draggable = function (start, move, end) {
                start = start || dragStart;
                move = move || dragMove;
                end = end || dragEnd;
                this.drag(move, start, end);
                return this;
            };

            Element.prototype.dragStart = function (handler) {
                return this.data('dragStart', handler);
            };

            Element.prototype.dragEnd = function (handler) {
                return this.data('dragEnd', handler);
            };

            Element.prototype.dragMove = function (handler) {
                return this.data('dragMove', handler);
            };

            Element.prototype.touchable = function () {
                return this
                    .touchstart(dragStart)
                    .touchend(dragEnd)
                    .touchmove(dragMove);
            };
        });

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

        var invokeListener = function () {
            if (factory.listener) {
                var selected = factory.editor.select('.selected');
                if (selected) {
                    factory.listener(selected.parent().attr('data-path'));
                } else {
                    factory.listener(null);
                }
            }
            };

        function isTruish(val) {
            return (val === 'true' || val > 0 || val === true);
        }

        return factory;
    });