'use strict';

angular.module('editorApp')
    .factory('uiFactory', function (kFactory, kModelHelper, KWE_POSITION) {
        var GROUP_RADIUS = 55,
            GROUP_PLUG_RADIUS = 10,
            NODE_WIDTH = 180,
            NODE_HEIGHT = 50,
            CHILD_HEIGHT = 40,
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
                var editor = new Snap('svg#editor');
                editor.zpd({ zoomThreshold: [ 0.2, 1 ], zoomScale: 0.05 });
                var zpdEditor = this.editor = editor.select('#snapsvg-zpd-'+editor.id);
                editor.mousedown(function () {
                    // remove all selected state
                    editor.selectAll('.instance .bg').forEach(function (elem) {
                        elem.removeClass('selected');
                    });
                    if (factory.listener) {
                        factory.listener();
                    }
                });
                updateSVGDefs(this.model);

                function updateCoords() {
                    var matrix = zpdEditor.transform().localMatrix;
                    editor
                        .select('#coord-text')
                        .removeClass('hide')
                        .attr({
                            text: '('+parseInt(matrix.e, 10)+', '+parseInt(matrix.f, 10)+') '+parseInt(matrix.a * 100, 10)+'%'
                        });
                }

                editor.drag(updateCoords);
                if (navigator.userAgent.toLowerCase().indexOf('webkit') >= 0 ||
                    navigator.userAgent.toLowerCase().indexOf('trident') >= 0) {
                    editor.node.addEventListener('mousewheel', updateCoords, false); // Chrome/Safari
                }
                else {
                    editor.node.addEventListener('DOMMouseScroll', updateCoords, false); // Others
                }

                editor.dblclick(function () {
                    zpdEditor.animate({transform: 's1,t0,0'}, 400, mina.ease, updateCoords);
                });

                editor
                    .text('100%', '100%', '(0, 0) 100%')
                    .attr({
                        id: 'coord-text',
                        fill: '#000',
                        textAnchor: 'end'
                    })
                    .transform('t-5,-5');
            },

            /**
             *
             * @param instance
             * @returns {*}
             */
            createGroup: function (instance) {
                var bg = this.editor
                    .circle(0, 0, GROUP_RADIUS)
                    .attr({
                        fill: 'green',
                        stroke: '#000',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var plug = this.editor
                    .circle(0, (GROUP_RADIUS/2)+GROUP_PLUG_RADIUS, GROUP_PLUG_RADIUS)
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
                    .text(0, -5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#group-clip)'
                    });

                var tdefText = this.editor
                    .text(0, 10, instance.typeDefinition.name)
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
                    .draggable(instance)
                    .relocate(instance);
            },

            createNode: function (instance) {
                var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                var computedWidth = NODE_WIDTH+(20*treeHeight);
                if (instance.host) {
                    computedWidth = NODE_WIDTH+(20*(kModelHelper.getNodeTreeHeight(instance.host)-1));
                }
                var bg = this.editor
                    .rect(0, 0, computedWidth, getNodeUIHeight(instance), 8)
                    .attr({
                        fill: 'white',
                        fillOpacity: 0.1,
                        stroke: 'white',
                        strokeWidth: 2,
                        'class': 'bg'
                    });

                var nameText = this.editor
                    .text(computedWidth/2, NODE_HEIGHT/2, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#node-clip-'+treeHeight+')'
                    });

                var tdefText = this.editor
                    .text(computedWidth/2, (NODE_HEIGHT/2)+12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#node-clip-'+treeHeight+')'
                    });

                var hasMoved = false,
                    parentNode = instance.host;

                var node = this.editor
                    .group()
                    .attr({ 'class': 'instance node', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable(instance)
                    .dragMove(function () {
                        if (!hasMoved) {
                            if (parentNode) {
                                instance.host = null;
                                //parentNode.removeHosts(instance);
                            }
                        }
                        hasMoved = true;
                    })
                    .dragEnd(function (evt) {
                        if (hasMoved) {
                            if (parentNode) {
                                var intersectedNodes = factory.editor
                                    .selectAll('.instance.node').items
                                    .filter(function (node) {
                                        // get rid of the chicken/egg problem && be sure the click is in a node
                                        return (node.attr('data-path') !== instance.path()) &&
                                            isPointInsideElem(node, evt.offsetX, evt.offsetY);
                                    })
                                    .sort(function (a, b) {
                                        // sort by width, smallest first
                                        return a.getBBox().width - b.getBBox().width;
                                    });
                                if (intersectedNodes.length === 0) {
                                    // if dropped in "nothing" then it means put it at the root of the model
                                    node.remove();
                                    factory.model.addNodes(instance);
                                } else {
                                    // put it in the hovered node
                                    node.remove();
                                    factory.model.findByPath(intersectedNodes[0].attr('data-path')).addHosts(instance);
                                }
                            }
                            parentNode = null;
                            hasMoved = false;
                        }
                    });

                if (instance.host) {
                    var host = this.editor.select('.node[data-path="'+instance.host.path()+'"]');
                    var children = host.selectAll('.node[data-path="'+instance.host.path()+'"] > .instance').items;
                    var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
                        dy = NODE_HEIGHT;
                    children.forEach(function (child) {
                        dy += child.select('.bg').asPX('height') + 10;
                    });
                    host.append(node);
                    node.transform('t'+dx+','+dy);
                } else {
                    node.relocate(instance);
                }

                try {
                    refreshNode(getHighestNodePath(node));
                } catch (err) {}
                return node;
            },

            createComponent: function (instance) {
                var host = this.editor.select('.instance[data-path="'+instance.eContainer().path()+'"]');
                var computedWidth = host.select('.bg').asPX('width') - 20;
                var compDepth = kModelHelper.getCompDepth(instance);
                var bg = this.editor
                    .rect(0, 0, computedWidth, CHILD_HEIGHT, 3)
                    .attr({
                        fill: 'black',
                        fillOpacity: isTruish(instance.started) ? 1 : 0.65,
                        stroke: 'white',
                        strokeWidth: 1.5,
                        'class': 'bg'
                    });

                var nameText = this.editor
                    .text(computedWidth/2, CHILD_HEIGHT/2, instance.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#comp-clip-'+compDepth+')'
                    });

                var tdefText = this.editor
                    .text(computedWidth/2, (CHILD_HEIGHT/2)+12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#comp-clip-'+compDepth+')'
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
                            parentNode.removeComponents(instance);
                        }
                        hasMoved = true;
                    })
                    .dragEnd(function (evt) {
                        if (hasMoved) {
                            var hoveredNode = getHoveredNode(evt.offsetX, evt.offsetY);
                            if (hoveredNode) {
                                comp.remove();
                                factory.model.findByPath(hoveredNode.attr('data-path')).addComponents(instance);
                            } else {
                                // if dropped in "nothing" then put it back into its old host node
                                comp.remove();
                                parentNode.addComponents(instance);
                            }
                            parentNode = null;
                            hasMoved = false;
                        }
                    }
                );

                var children = host.selectAll('.instance[data-path="'+instance.eContainer().path()+'"] > .instance').items;
                var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
                    dy = NODE_HEIGHT;
                children.forEach(function (child) {
                    dy += child.select('.bg').asPX('height') + 10;
                });
                comp.transform('t'+dx+','+dy);
                host.append(comp);

                try {
                    refreshNode(getHighestNodePath(comp));
                } catch (err) {}
                return comp;
            },

            createChannel: function (instance) {
                var bg = this.editor
                    .circle(0, 0, CHANNEL_RADIUS)
                    .attr({
                        fill: '#d57129',
                        stroke: '#fff',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var nameText = this.editor
                    .text(0, -5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#chan-clip)'
                    });

                var tdefText = this.editor
                    .text(0, 10, instance.typeDefinition.name)
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
                    .draggable(instance)
                    .relocate(instance);
            },

            deleteInstance: function (parent, path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    if (elem.hasClass('comp') || elem.hasClass('node')) {
                        var highestNodePath = getHighestNodePath(elem);
                        if (factory.draggedInstancePath === path) {
                            var absBbox = getAbsoluteBBox(elem);

                            // append it to the editor
                            this.editor.append(elem);

                            elem.data('ot', 't'+absBbox.x+','+absBbox.y);
                        } else {
                            elem.remove();
                        }

                        refreshNode(highestNodePath);
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
                console.log('UPDATE INSTANCE', instance.path());
                var elem = this.editor.select('.instance[data-path="'+previousPath+'"]');
                if (elem) {
                    // update data-path and name
                    elem.attr({ 'data-path': instance.path() })
                        .select('text.name')
                        .attr({ text: instance.name });

                    // update location only if not a child of someone
                    if (!elem.parent().hasClass('node')) {
                        elem.relocate(instance);
                    }

                    // update children data-path if any
                    if (instance.components || instance.hosts) {
                        instance.components.array.forEach(function (comp) {
                            var compElem = elem.select('.instance[data-path="'+previousPath+'/components['+comp.name+']"]');
                            if (compElem) {
                                compElem.attr({ 'data-path': comp.path().replace(previousPath, instance.path()) });
                            }
                        });
                    }

                    // update started state
                    if (elem.hasClass('comp')) {
                        elem.select('.bg')
                            .attr({ fillOpacity: isTruish(instance.started) ? 1 : 0.65 });
                    } else {
                        elem.select('text.name')
                            .attr({ fill: isTruish(instance.started) ? '#fff' : '#000' });
                    }
                }
            },

            getSelected: function () {
                var selected = this.editor
                    .selectAll('.selected').items
                    .map(function (elem) {
                        // .selected class is given to .bg so we need to retrieve the parent
                        return elem.parent();
                    });

                var children = [];
                selected.forEach(function (elem) {
                    children = children.concat(elem.selectAll('.instance').items);
                });

                return selected
                    .concat(children)
                    .map(function (elem) {
                        return elem.attr('data-path');
                    });
            },

            getNodePathAtPoint: function (x, y) {
                var container = this.getEditorContainer();
                var node = getHoveredNode(x-container.offsetLeft, y-container.offsetTop);
                if (node) {
                    return node.attr('data-path');
                } else {
                    return null;
                }
            },

            getEditorContainer: function () {
                return document.getElementById('editor-container');
            },

            setSelectedListener: function (listener) {
                this.listener = listener;
            },

            setModel: function (model) {
                this.model = model;
                if (this.editor) {
                    updateSVGDefs(model);

                    this.editor.selectAll('.instance').remove();
                    invokeListener();
                }
            }
        };

        /**
         *
         */
        Snap.plugin(function (Snap, Element) {
            var dragStart = function (dx) {
                factory.draggedInstancePath = this.attr('data-path');

                var fn = this.data('dragStart');
                if (fn) {
                    fn.apply(this, arguments);
                }
                if((typeof dx === 'object') && ( dx.type === 'touchstart')) {
                    mouseDownHandler.call(this, dx); // select instance on touch event
                    dx.preventDefault();
                    this.data('ox', dx.changedTouches[0].clientX);
                    this.data('oy', dx.changedTouches[0].clientY);
                }
                this.data('ot', this.transform().local );
            };

            var dragMove = function (dx, dy, x, y, evt) {
                var fn = this.data('dragMove');
                if (fn) {
                    fn.apply(this, arguments);
                }

                if((typeof dx === 'object') && ( dx.type === 'touchmove')) {
                    dy = dx.changedTouches[0].clientY - this.data('oy');
                    dx = dx.changedTouches[0].clientX - this.data('ox');
                }

                this.transform(this.data('ot') + (this.data('ot') ? 'T':'t') + [ dx, dy ]);

                //if (factory.draggedInstancePath) {
                //    factory.editor.selectAll('.node .bg').attr({ stroke: 'white' });
                //    var node = getHoveredNode(evt.offsetX, evt.offsetY);
                //    if (node) {
                //        node.select('.bg').attr({ stroke: 'yellow' });
                //    }
                //}
            };

            var dragEnd = function () {
                var fn = this.data('dragEnd');
                if (fn) {
                    fn.apply(this, arguments);
                }
                factory.draggedInstancePath = null;
                factory.editor.selectAll('.node .bg').attr({ stroke: 'white' });
            };

            Element.prototype.draggable = function (instance) {
                this.drag(dragMove, dragStart, function () {
                    if (instance) {
                        console.log('draggable.dragEnd', instance.path());
                        var pos = instance.findMetaDataByID(KWE_POSITION);
                        if (!pos) {
                            pos = kFactory.createValue();
                            pos.name = KWE_POSITION;
                            instance.addMetaData(pos);
                        }
                        var matrix = this.transform().localMatrix;
                        pos.value = JSON.stringify({ x: matrix.e, y: matrix.f });
                    }
                    dragEnd.apply(this, arguments);
                });
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

            Element.prototype.relocate = function (instance) {
                var meta = instance.findMetaDataByID(KWE_POSITION);
                var pos = { x: 100, y: 100 };
                if (meta) {
                    try {
                        pos = JSON.parse(meta.value);
                    } catch (ignore) {
                        pos = { x: 100, y: 100 };
                    }
                } else {
                    meta = kFactory.createValue();
                    meta.name = KWE_POSITION;
                    meta.value = JSON.stringify(pos);
                    instance.addMetaData(meta);
                }
                this.transform('t'+pos.x+','+pos.y);
                console.log('relocated', instance.path(), 't'+pos.x+','+pos.y);
                return this;
            };
        });

        /**
         *
         * @param evt
         */
        var mouseDownHandler = function (evt) {
            if (!evt.ctrlKey && !evt.shiftKey) {
                factory.editor.selectAll('.bg').forEach(function (elem) {
                    elem.removeClass('selected');
                });
            }
            if (evt.ctrlKey || evt.shiftKey) {
                this.select('.bg').toggleClass('selected');
            } else {
                this.select('.bg').addClass('selected');
            }
            evt.cancelBubble = true;
            if (factory.listener) {
                factory.listener(this.attr('data-path'));
            }
        };

        /**
         *
         * @param selected
         */
        var invokeListener = function (selected) {
            if (factory.listener) {
                if (selected) {
                    factory.listener(selected);
                } else {
                    selected = factory.editor.select('.selected');
                    if (selected) {
                        factory.listener(selected.parent().attr('data-path'));
                    } else {
                        factory.listener(null);
                    }
                }
            }
        };

        /**
         *
         * @param node
         * @returns {number}
         */
        function getNodeUIHeight(node) {
            var height = NODE_HEIGHT; // minimum node height
            height += node.components.size() * (CHILD_HEIGHT + 10); // add-up components height + margins

            node.hosts.array.forEach(function (child) {
                height += getNodeUIHeight(child) + 10;
            });

            return height;
        }

        /**
         *
         * @param path
         */
        function refreshNode(path) {
            var instance = factory.model.findByPath(path);
            if (instance) {
                var node = factory.editor.select('.node[data-path="'+path+'"]');
                var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                var computedWidth = NODE_WIDTH+(20*treeHeight);
                if (instance.host) {
                    computedWidth = NODE_WIDTH+(20*(kModelHelper.getNodeTreeHeight(instance.host)-1));
                }

                node.select('.bg').attr({
                    width: computedWidth,
                    height: getNodeUIHeight(instance)
                });
                node.selectAll('text').attr({ x: computedWidth / 2 });

                instance.components.array.forEach(function (comp) {
                    refreshComp(comp.path());
                });

                instance.hosts.array.forEach(function (host) {
                    refreshNode(host.path());
                });

                // apply dx,dy transformation of level-1 children
                var children = factory.editor.selectAll('.node[data-path="'+instance.path()+'"] > .instance').items;
                var dy = NODE_HEIGHT;
                children.forEach(function (child) {
                    child.transform('t'+((computedWidth - child.select('.bg').asPX('width'))/2)+','+dy);
                    dy += child.select('.bg').asPX('height') + 10;
                });
            }
        }

        /**
         *
         * @param path
         */
        function refreshComp(path) {
            var instance = factory.model.findByPath(path);
            if (instance) {
                var comp = factory.editor.select('.comp[data-path="'+path+'"]');
                var host = factory.editor.select('.node[data-path="'+instance.eContainer().path()+'"]');
                var computedWidth = host.select('.bg').asPX('width') - 20;

                comp.select('.bg').attr({ width: computedWidth });
                comp.selectAll('text')
                    .attr({ x: computedWidth / 2 });
            }
        }

        /**
         * Returns the highest node path regarding the given SVG element (supposed to be a .node or a .comp)
         * @param elem
         */
        function getHighestNodePath(elem) {
            if (elem.parent().hasClass('instance')) {
                return getHighestNodePath(elem.parent());
            } else {
                return elem.attr('data-path');
            }
        }

        /**
         *
         * @param elem
         * @returns {{x, y, x2, y2, width, height, cx, cy}|*}
         */
        function getAbsoluteBBox(elem) {
            var bbox = elem.getBBox();

            function walkUp(elem) {
                if (elem.parent().hasClass('node')) {
                    var parentBox = elem.parent().getBBox();
                    bbox.x += parentBox.x;
                    bbox.y += parentBox.y;
                    walkUp(elem.parent());
                }
            }
            walkUp(elem);
            return bbox;
        }

        /**
         *
         * @param elem
         * @param x
         * @param y
         */
        function isPointInsideElem(elem, x, y) {
            var bbox = getAbsoluteBBox(elem);
            return  x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
        }

        /**
         *
         * @param x
         * @param y
         * @returns {*|T}
         */
        function getHoveredNode(x, y) {
            return factory.editor
                .selectAll('.node').items
                .filter(function (node) {
                    return isPointInsideElem(node, x, y)
                })
                .sort(function (a, b) {
                    return a.getBBox().width - b.getBBox().width;
                })[0];
        }

        /**
         *
         * @param model
         */
        function updateSVGDefs(model) {
            var editor = document.getElementById('editor');
            if (editor) {
                var defs = editor.getElementsByTagName('defs')[0];
                var clipPath;
                if (!document.getElementById('group-clip')) {
                    clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'group-clip';
                    var grpCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    grpCircle.setAttribute('cx', 0+'');
                    grpCircle.setAttribute('cy', 0+'');
                    grpCircle.setAttribute('r', (GROUP_RADIUS-4)+'');
                    clipPath.appendChild(grpCircle);
                    defs.appendChild(clipPath);
                }

                if (!document.getElementById('chan-clip')) {
                    clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'chan-clip';
                    var chanCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    chanCircle.setAttribute('cx', 0+'');
                    chanCircle.setAttribute('cy', 0+'');
                    chanCircle.setAttribute('r', (CHANNEL_RADIUS-4)+'');
                    clipPath.appendChild(chanCircle);
                    defs.appendChild(clipPath);
                }

                var nodeTreeHeights = kModelHelper.getNodeTreeHeights(model.nodes.array);
                var highest = 0;
                nodeTreeHeights.forEach(function (height) {
                    if (height > highest) {
                        highest = height;
                    }
                    if (!document.getElementById('node-clip-'+height)) {
                        var nodeClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        nodeClip.id = 'node-clip-'+height;
                        var nodeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        nodeRect.setAttribute('width', ((NODE_WIDTH+(20*height))-5)+'');
                        nodeRect.setAttribute('height', NODE_HEIGHT+'');
                        nodeRect.setAttribute('x', 2+'');
                        nodeRect.setAttribute('y', 0+'');
                        nodeClip.appendChild(nodeRect);
                        defs.appendChild(nodeClip);
                    }
                });
                nodeTreeHeights.forEach(function (height) {
                    if (!document.getElementById('comp-clip-'+height)) {
                        var compClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        compClip.id = 'comp-clip-'+height;
                        var compRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        compRect.setAttribute('width', ((NODE_WIDTH+(20*(highest - height)))-25)+'');
                        compRect.setAttribute('height', NODE_HEIGHT+'');
                        compRect.setAttribute('x', 2+'');
                        compRect.setAttribute('y', 0+'');
                        compClip.appendChild(compRect);
                        defs.appendChild(compClip);
                    }
                });
            }
        }

        /**
         *
         * @param val
         * @returns {boolean}
         */
        function isTruish(val) {
            return (val === 'true' || val > 0 || val === true);
        }

        return factory;
    });