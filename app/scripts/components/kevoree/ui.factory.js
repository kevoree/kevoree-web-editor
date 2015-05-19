'use strict';

angular.module('editorApp')
    .factory('uiFactory', function () {

        function svg() {
            return new Snap('svg#editor');
        }

        function moveHandler(dx, dy) {
            this.attr({
                transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
            });
        }

        function startHandler() {
            this.data('origTransform', this.transform().local );
        }

        function stopHandler() {
            console.log('finished dragging', this);
        }

        return {
            createGroup: function (elem) {
                var groupBg = svg()
                    .circle(100, 100, 55)
                    .attr({
                        fill: 'green',
                        stroke: '#000',
                        strokeWidth: 4
                    });

                var plug = svg()
                    .circle(100, (55/2)+112, 12)
                    .attr({
                        fill: '#f1c30f'
                    });
                plug.mouseover(function () {
                    plug.attr({r: 13});
                });
                plug.mouseout(function () {
                    plug.attr({r: 12});
                });

                var nameText = svg()
                    .text(100, 95, elem.name)
                    .attr({
                        fill: 'white',
                        align: 'center',
                        'class': 'group'
                    });
                nameText.attr({
                    x: '-='+angular.element(nameText.node).width()/2
                });

                var tdefText = svg()
                    .text(100, 110, elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        align: 'center',
                        'class': 'group'
                    });
                tdefText.attr({
                    x: '-='+angular.element(tdefText.node).width()/2
                });

                return svg()
                    .group()
                    .append(groupBg)
                    .append(nameText)
                    .append(tdefText)
                    .append(plug)
                    .drag(moveHandler, startHandler, stopHandler);
            },

            createNode: function (elem) {
                var width = 150,
                    height = 50;
                var nodeBg = svg()
                    .rect(200, 100, 150, 50, 10)
                    .attr({
                        fill: 'white',
                        fillOpacity: 0.1,
                        stroke: 'white',
                        strokeWidth: 2
                    });

                var nameText = svg()
                    .text(200+(width/2), 97+(height/2), elem.name)
                    .attr({
                        fill: 'white',
                        align: 'center',
                        'class': 'node'
                    });

                nameText.attr({
                    x: '-='+angular.element(nameText.node).width()/2
                });

                var tdefText = svg()
                    .text(200+(width/2), 112+(height/2), elem.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        align: 'center',
                        'class': 'node'
                    });

                tdefText.attr({
                    x: '-='+angular.element(tdefText.node).width()/2
                }); 


                return svg()
                    .group()
                    .append(nodeBg)
                    .append(nameText)
                    .append(tdefText)
                    .drag(moveHandler, startHandler, stopHandler);
            }
        }
    });