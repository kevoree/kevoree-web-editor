'use strict';

angular.module('editorApp')
    .factory('uiFactory', function (kEditor) {
        var initDone = false;

        var factory = {
            /**
             * Should be called only one time to init the Editor panel
             */
            init: function () {
                if (!initDone) {
                    initDone = true;
                    var editor = this.editor = new Snap('svg#editor');
                    editor.mousedown(function () {
                        editor.selectAll('.instance').forEach(function (elem) {
                            elem.removeClass('selected');
                        });
                    });
                }
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
                        'class': 'instance group',
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
                        fill: 'white'
                    });
                nameText.attr({
                    x: '-='+angular.element(nameText.node).width()/2
                });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white'
                    });
                tdefText.attr({
                    x: '-='+angular.element(tdefText.node).width()/2
                });

                return this.editor
                    .group()
                    .data('path', elem.path())
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
                        'class': 'instance node'
                    });

                var nameText = this.editor
                    .text(x+(width/2), y+(height/2)+5, elem.name)
                    .attr({
                        fill: 'white'
                    });

                nameText.attr({
                    x: '-='+angular.element(nameText.node).width()/2
                });

                var tdefText = this.editor
                    .text(x+(width/2), y+(height/2)+17, elem.typeDefinition.name)
                    .attr({
                        fill: 'white'
                    });

                tdefText.attr({
                    x: '-='+angular.element(tdefText.node).width()/2
                });


                return this.editor
                    .group()
                    .data('path', elem.path())
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
                        'class': 'instance chan',
                        opacity: 0.75
                    });

                var nameText = this.editor
                    .text(x, y-5, elem.name)
                    .attr({
                        fill: 'white'
                    });
                nameText.attr({
                    x: '-='+angular.element(nameText.node).width()/2
                });

                var tdefText = this.editor
                    .text(x, y+10, elem.typeDefinition.name)
                    .attr({
                        fill: 'white'
                    });
                tdefText.attr({
                    x: '-='+angular.element(tdefText.node).width()/2
                });

                return this.editor
                    .group()
                    .data('path', elem.path())
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
                    .data('path', elem.path())
                    .drag();
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
            kEditor.setDraggedElem({
                instance: kEditor.getModel().findByPath(this.data('path')),
                isNew: false
            });
        };

        var stopHandler = function () {
            kEditor.setDraggedElem(null);
        };

        var mouseDownHandler = function (evt) {
            var elem = this.select('.instance');
            if (elem.hasClass('selected')) {
                // already selected: open settings
                console.log('open settings', this.data('path'));
            }
            if (!evt.ctrlKey && !evt.shiftKey) {
                factory.editor.selectAll('.instance').forEach(function (elem) {
                    elem.removeClass('selected');
                });
            }
            elem.addClass('selected');
            evt.cancelBubble = true;
        };

        var mouseOverNodeHandler = function () {
            console.log('mouse over node', this.data('path'));
        };

        return factory;
    });