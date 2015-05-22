'use strict';

angular.module('editorApp')
    .factory('uiFactory', function () {
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
                var x = 100,
                    y = 100,
                    radius = 45,
                    plugRadius = 10;

                var bg = this.editor
                    .circle(x, y, radius)
                    .attr({
                        fill: 'green',
                        stroke: '#000',
                        strokeWidth: 4,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var plug = this.editor
                    .circle(x, (radius/2)+y+plugRadius, plugRadius)
                    .attr({
                        fill: '#f1c30f',
                        'class': 'group-plug'
                    });
                plug.mouseover(function () {
                    plug.attr({r: plugRadius+1});
                });
                plug.mouseout(function () {
                    plug.attr({r: plugRadius});
                });

                var nameText = this.editor
                    .text(x, y-5, elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name'
                    });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance group', 'data-path': elem.path() })
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
                var x = 200,
                    y = 100,
                    width = 150,
                    height = 50;

                var bg = this.editor
                    .rect(x, y, width, height, 10)
                    .attr({
                        fill: 'white',
                        fillOpacity: 0.1,
                        stroke: 'white',
                        strokeWidth: 2,
                        'class': 'bg'
                    });

                var nameText = this.editor
                    .text(x+(width/2), y+(height/2), elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name'
                    });

                var tdefText = this.editor
                    .text(x+(width/2), y+(height/2)+12, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle'
                    });

                return this.editor
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
            },

            createChannel: function (elem) {
                var x = 100,
                    y = 400,
                    radius = 45;

                var bg = this.editor
                    .circle(x, y, radius)
                    .attr({
                        fill: '#d57129',
                        stroke: '#fff',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var nameText = this.editor
                    .text(x, y-5, elem.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name'
                    });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle'
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
                return this.editor
                    .text(100, 300, elem.name)
                    .attr({'class': 'instance comp', 'data-path': elem.path() })
                    .drag();
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