'use strict';

angular.module('editorApp')
  .factory('uiCreateComponent', function ($uibModal, uiUtils, util, kFactory, kModelHelper, Notification, COMP_HEIGHT, NODE_HEIGHT) {
    return function (ui, instance) {
      var output, input;
      ui.removeUIElem(instance.path());
      uiUtils.updateSVGDefs(ui.model);

      var host = ui.editor.select('.instance[data-path="' + instance.eContainer().path() + '"]');
      var computedWidth = host.select('.bg').asPX('width') - 20,
        computedHeight = uiUtils.getCompUIHeight(instance);
      var hostHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
      var bg = ui.editor
        .rect(0, 0, computedWidth, computedHeight, 3)
        .attr({
          fill: 'black',
          fillOpacity: util.isTruish(instance.started) ? 1 : 0.65,
          stroke: 'white',
          strokeWidth: 1.5,
          'class': kModelHelper.isSelected(instance) ? 'bg selected' : 'bg'
        });

      var nameText = ui.editor
        .text(computedWidth / 2, computedHeight / 2, instance.name)
        .attr({
          fill: 'white',
          textAnchor: 'middle',
          'class': 'name',
          'clip-path': 'url(#comp-clip-' + hostHeight + ')'
        });

      var tdefText = ui.editor
        .text(computedWidth / 2, (computedHeight / 2) + 12, instance.typeDefinition.name)
        .attr({
          fill: 'white',
          textAnchor: 'middle',
          'clip-path': 'url(#comp-clip-' + hostHeight + ')'
        });

      var comp = ui.editor
        .group()
        .attr({
          'class': 'instance comp',
          'data-path': instance.path()
        })
        .append(bg)
        .append(nameText)
        .append(tdefText);

      var PORT_X_PADDING = 3,
        providedDy = 0,
        requiredDy = 0;
      instance.typeDefinition.provided.array.forEach(function (portType) {
        var portPlug = ui.editor
          .rect(-8, 5, 10, COMP_HEIGHT - 10, 2)
          .attr({
            fill: '#bc7645',
            stroke: '#ECCA40',
            strokeWidth: 2
          })
          .mouseover(function () {
            this.attr({
              strokeWidth: 3
            });
          })
          .mouseout(function () {
            this.attr({
              strokeWidth: 2
            });
          })
          .mousedown(function (evt) {
            evt.cancelBubble = true;
          })
          .touchstart(function (evt) {
            evt.cancelBubble = true;
          })
          .drag(
            function (dx, dy, cx, cy) {
              var portPos = this.data('portPos');
              var middle = { x: 0, y: 0 };
              if (portPos.x > (portPos.x + dx)) {
                middle.x = (portPos.x + dx) + (portPos.x - (portPos.x + dx)) / 2;
              } else {
                middle.x = portPos.x + ((portPos.x + dx) - portPos.x) / 2;
              }

              middle.y = ((portPos.y >= (portPos.y + dy)) ? portPos.y : (portPos.y + dy)) + 20;
              this.data('binding').attr({
                d: 'M' + portPos.x + ',' + portPos.y + ' Q' + middle.x + ',' + middle.y + ' ' + (portPos.x + dx) + ',' + (portPos.y + dy)
              });

              clearTimeout(this.data('bindingTimeout'));
              var portElem = this.data('hoveredPort');
              if (portElem) {
                portElem.select('text').removeClass('hovered error');
              }
              var chanElem = this.data('hoveredChan');
              if (chanElem) {
                chanElem.select('.bg').removeClass('hovered error');
              }

              var timeout = setTimeout(function () {
                var pt = uiUtils.getPointInEditor(cx, cy);
                var portElem = ui.getHoveredPort(pt.x, pt.y);
                if (portElem) {
                  this.data('hoveredChan', null);
                  this.data('hoveredPort', portElem);
                  var portText = portElem.select('text');
                  portText.addClass('hovered');

                  if (portElem.hasClass('provided')) {
                    portText.addClass('error');
                  }

                } else {
                  this.data('hoveredPort', null);
                  var chanElem = ui.getHoveredChan(portPos.x + dx, portPos.y + dy);
                  if (chanElem) {
                    this.data('hoveredChan', chanElem);
                    var chanBg = chanElem.select('.bg');
                    chanBg.addClass('hovered');

                    var chan = ui.model.findByPath(chanElem.attr('data-path'));
                    if (kModelHelper.isAlreadyBound(instance.findProvidedByID(portType.name), chan) ||
                      !kModelHelper.isCompatible(chan.typeDefinition, instance.eContainer())) {
                      chanBg.addClass('error');
                    }
                  } else {
                    this.data('hoveredChan', null);
                  }
                }
              }.bind(this), 100);
              this.data('bindingTimeout', timeout);
            },
            function () {
              var portM = input.transform().localMatrix,
                compBox = uiUtils.getAbsoluteBBox(comp);
              var portPos = {
                x: portM.e + compBox.x,
                y: portM.f + compBox.y + ((COMP_HEIGHT - 6) / 2) + 3
              };
              this.data('portPos', portPos);
              var binding = ui.editor
                .path('M' + portPos.x + ',' + portPos.y + ' ' + portPos.x + ',' + portPos.y)
                .attr({
                  fill: 'none',
                  stroke: '#ECCA40',
                  strokeWidth: 5,
                  strokeLineCap: 'round',
                  strokeLineJoin: 'round',
                  opacity: 0.7
                });
              this.data('binding', binding);
            },
            function () {
              clearTimeout(this.data('bindingTimeout'));

              var port = instance.findProvidedByID(portType.name);
              if (!port) {
                port = kFactory.createPort();
                port.name = portType.name;
                port.portTypeRef = portType;
                instance.addProvided(port);
              }

              var hoveredChan = this.data('hoveredChan');
              if (hoveredChan) {
                var chan = ui.model.findByPath(hoveredChan.attr('data-path'));
                if (!hoveredChan.select('.bg').hasClass('error')) {
                  if (chan) {
                    var binding = kFactory.createMBinding();
                    binding.hub = chan;
                    binding.port = port;
                    ui.model.addMBindings(binding);
                  }
                } else {
                  if (chan && !kModelHelper.isCompatible(chan.typeDefinition, instance.eContainer())) {
                    Notification.error({
                      title: 'Binding error',
                      message: '<strong>' + chan.typeDefinition.name + '</strong> cannot run on platform <strong>' + kModelHelper.getPlatforms(instance.eContainer().typeDefinition).join('') + '</strong>',
                      delay: 10000
                    });
                  }
                }

                // remove ui feedback
                hoveredChan.select('.bg').removeClass('hovered error');
              } else {
                var hoveredPort = this.data('hoveredPort');
                if (hoveredPort) {
                  if (!hoveredPort.select('text').hasClass('error')) {
                    var otherPortName = hoveredPort.attr('data-name');
                    var otherPortComp = ui.model.findByPath(hoveredPort.parent().attr('data-path'));
                    var otherPort = otherPortComp.findRequiredByID(otherPortName);
                    if (!otherPort) {
                      otherPort = kFactory.createPort();
                      otherPort.name = otherPortName;
                      otherPort.portTypeRef = otherPortComp.typeDefinition.findRequiredByID(otherPortName);
                      otherPortComp.addRequired(otherPort);
                    }

                    $uibModal
                      .open({
                        templateUrl: 'app/main/editor/select-chan.modal.html',
                        controller: 'SelectChanModalCtrl',
                        resolve: {
                          startPort: port,
                          endPort: otherPort
                        }
                      })
                      .result.then(function (chanInstance) {
                        if (chanInstance) {
                          var binding = kFactory.createMBinding();
                          binding.hub = chanInstance;
                          binding.port = port;
                          ui.model.addMBindings(binding);

                          var binding2 = kFactory.createMBinding();
                          binding2.hub = chanInstance;
                          binding2.port = otherPort;
                          ui.model.addMBindings(binding2);
                        }
                      });
                  }
                  hoveredPort.select('text').removeClass('hovered error');
                }
              }

              this.data('binding').remove();

              this.removeData('binding');
              this.removeData('bindingTimeout');
              this.removeData('hoveredPort');
              this.removeData('hoveredChan');
              this.removeData('portPos');
            });

        var text = ui.editor
          .text(6, COMP_HEIGHT - 4, portType.name.substr(0, 6))
          .attr({
            fill: 'white',
            title: portType.name
          })
          .append(Snap.parse('<title>' + portType.name + '</title>'));

        input = ui.editor
          .group()
          .attr({
            'class': 'port provided',
            'data-name': portType.name
          })
          .append(portPlug)
          .append(text)
          .transform('t' + PORT_X_PADDING + ',' + providedDy);

        comp.append(input);

        providedDy += COMP_HEIGHT;
      });

      instance.typeDefinition.required.array.forEach(function (portType) {
        var portPlug = ui.editor
          .rect(-3, 5, 10, COMP_HEIGHT - 10, 2)
          .attr({
            fill: '#bc7645',
            stroke: '#C60808',
            strokeWidth: 2
          })
          .mouseover(function () {
            this.attr({ strokeWidth: 3 });
          })
          .mouseout(function () {
            this.attr({ strokeWidth: 2 });
          })
          .mousedown(function (evt) {
            evt.cancelBubble = true;
          })
          .touchstart(function (evt) {
            evt.cancelBubble = true;
          })
          .drag(
            function (dx, dy, cx, cy) {
              var portPos = this.data('portPos');
              var middle = {
                x: 0,
                y: 0
              };
              if (portPos.x > (portPos.x + dx)) {
                middle.x = (portPos.x + dx) + (portPos.x - (portPos.x + dx)) / 2;
              } else {
                middle.x = portPos.x + ((portPos.x + dx) - portPos.x) / 2;
              }

              middle.y = ((portPos.y >= (portPos.y + dy)) ? portPos.y : (portPos.y + dy)) + 20;
              this.data('binding').attr({
                d: 'M' + portPos.x + ',' + portPos.y + ' Q' + middle.x + ',' + middle.y + ' ' + (portPos.x + dx) + ',' + (portPos.y + dy)
              });

              clearTimeout(this.data('bindingTimeout'));
              var portElem = this.data('hoveredPort');
              if (portElem) {
                portElem.select('text').removeClass('hovered error');
              }
              var chanElem = this.data('hoveredChan');
              if (chanElem) {
                chanElem.select('.bg').removeClass('hovered error');
              }

              var timeout = setTimeout(function () {
                var pt = uiUtils.getPointInEditor(cx, cy);
                var portElem = ui.getHoveredPort(pt.x, pt.y);
                if (portElem) {
                  this.data('hoveredChan', null);
                  this.data('hoveredPort', portElem);
                  if (portElem.hasClass('required')) {
                    portElem.select('text').addClass('hovered error');
                  } else {
                    portElem.select('text').addClass('hovered');
                  }
                } else {
                  this.data('hoveredPort', null);
                  var chanElem = ui.getHoveredChan(portPos.x + dx, portPos.y + dy);
                  if (chanElem) {
                    this.data('hoveredChan', chanElem);
                    var chanBg = chanElem.select('.bg');
                    chanBg.addClass('hovered');

                    var chan = ui.model.findByPath(chanElem.attr('data-path'));
                    if (kModelHelper.isAlreadyBound(instance.findRequiredByID(portType.name), chan) ||
                      !kModelHelper.isCompatible(chan.typeDefinition, instance.eContainer())) {
                      chanBg.addClass('error');
                    }
                  } else {
                    this.data('hoveredChan', null);
                  }
                }
              }.bind(this), 100);
              this.data('bindingTimeout', timeout);
            },
            function () {
              var portM = output.transform().localMatrix,
                compBox = uiUtils.getAbsoluteBBox(comp);
              var portPos = {
                x: portM.e + compBox.x,
                y: portM.f + compBox.y + ((COMP_HEIGHT - 6) / 2) + 3
              };
              this.data('portPos', portPos);
              var binding = ui.editor
                .path('M' + portPos.x + ',' + portPos.y + ' ' + portPos.x + ',' + portPos.y)
                .attr({
                  fill: 'none',
                  stroke: '#C60808',
                  strokeWidth: 5,
                  strokeLineCap: 'round',
                  strokeLineJoin: 'round',
                  opacity: 0.7
                });
              this.data('binding', binding);
            },
            function () {
              clearTimeout(this.data('bindingTimeout'));

              var port = instance.findRequiredByID(portType.name);
              if (!port) {
                port = kFactory.createPort();
                port.name = portType.name;
                port.portTypeRef = portType;
                instance.addRequired(port);
              }

              var hoveredChan = this.data('hoveredChan');
              if (hoveredChan) {
                var chan = ui.model.findByPath(hoveredChan.attr('data-path'));
                if (!hoveredChan.select('.bg').hasClass('error')) {
                  if (chan) {
                    var binding = kFactory.createMBinding();
                    binding.hub = chan;
                    binding.port = port;
                    ui.model.addMBindings(binding);
                  }
                } else {
                  if (chan && !kModelHelper.isCompatible(chan.typeDefinition, instance.eContainer())) {
                    Notification.error({
                      title: 'Binding error',
                      message: '<strong>' + chan.typeDefinition.name + '</strong> cannot run on platform <strong>' + kModelHelper.getPlatforms(instance.eContainer().typeDefinition).join('') + '</strong>',
                      delay: 10000
                    });
                  }
                }

                // remove ui feedback
                hoveredChan.select('.bg').removeClass('hovered error');
              } else {
                var hoveredPort = this.data('hoveredPort');
                if (hoveredPort) {
                  if (!hoveredPort.select('text').hasClass('error')) {
                    var otherPortName = hoveredPort.attr('data-name');
                    var otherPortComp = ui.model.findByPath(hoveredPort.parent().attr('data-path'));
                    var otherPort = otherPortComp.findProvidedByID(otherPortName);
                    if (!otherPort) {
                      otherPort = kFactory.createPort();
                      otherPort.name = otherPortName;
                      otherPort.portTypeRef = otherPortComp.typeDefinition.findProvidedByID(otherPortName);
                      otherPortComp.addProvided(otherPort);
                    }

                    $uibModal
                      .open({
                        templateUrl: 'app/main/editor/select-chan.modal.html',
                        controller: 'SelectChanModalCtrl',
                        resolve: {
                          startPort: port,
                          endPort: otherPort
                        }
                      })
                      .result.then(function (chanInstance) {
                        if (chanInstance) {
                          var binding = kFactory.createMBinding();
                          binding.hub = chanInstance;
                          binding.port = port;
                          ui.model.addMBindings(binding);

                          var binding2 = kFactory.createMBinding();
                          binding2.hub = chanInstance;
                          binding2.port = otherPort;
                          ui.model.addMBindings(binding2);
                        }
                      });
                  }
                  hoveredPort.select('text').removeClass('hovered error');
                }
              }

              this.data('binding').remove();

              this.removeData('binding');
              this.removeData('bindingTimeout');
              this.removeData('hoveredChan');
              this.removeData('hoveredPort');
              this.removeData('portPos');
            });

        var text = ui.editor
          .text(-6, COMP_HEIGHT - 4, portType.name.substr(0, 6))
          .attr({
            fill: 'white',
            textAnchor: 'end',
            title: portType.name
          })
          .append(Snap.parse('<title>' + portType.name + '</title>'));

        output = ui.editor
          .group()
          .attr({
            'class': 'port required',
            'data-name': portType.name
          })
          .append(portPlug)
          .append(text)
          .transform('t' + (computedWidth - PORT_X_PADDING) + ',' + requiredDy);

        comp.append(output);

        requiredDy += COMP_HEIGHT;
      });

      comp.selectable(instance)
        .draggable()
        .dragStart(function () {
          var container = document.getElementById('editor-container');
          this.data('offset', {
            left: container.offsetLeft,
            top: container.offsetTop
          });
        })
        .firstDragMove(function () {
          var args = arguments;

          this.data('parentNode', instance.eContainer());
          instance.eContainer().removeComponents(instance);

          // redraw bindings after component when dragging start
          var redrawBindings = function (port) {
            port.bindings.array.forEach(function (binding) {
              var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
              if (elem) {
                elem.data('firstDragMove').forEach(function (handler) {
                  handler.apply(elem, args);
                });
              }
            });
          };
          instance.provided.array.forEach(redrawBindings);
          instance.required.array.forEach(redrawBindings);
        })
        .dragMove(function (dx, dy, clientX, clientY) {
          var args = arguments;

          // ui-error feedback
          clearTimeout(this.data('dragTimeout'));
          var nodeElem = this.data('hoveredNode');
          if (nodeElem) {
            nodeElem.select('.bg').removeClass('hovered error');
          }

          var timeout = setTimeout(function () {
            var offset = this.data('offset');
            var nodeElem = ui.getHoveredNode(clientX - offset.left, clientY - offset.top, instance.path());
            if (nodeElem) {
              this.data('hoveredNode', nodeElem);
              nodeElem.select('.bg').addClass('hovered');
            } else {
              this.data('hoveredNode', null);
            }
          }.bind(this), 100);
          this.data('dragTimeout', timeout);

          // redraw bindings when dragging
          var redrawBindings = function (port) {
            port.bindings.array.forEach(function (binding) {
              var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
              if (elem) {
                elem.data('endPtDrag').apply(elem, args);
              }
            });
          };
          instance.provided.array.forEach(redrawBindings);
          instance.required.array.forEach(redrawBindings);
        })
        .dragEnd(function () {
          var hoveredNode = this.data('hoveredNode');
          if (hoveredNode) {
            // remove ui-feedback classes
            hoveredNode.select('.bg').removeClass('hovered error');

            comp.remove();
            ui.model.findByPath(hoveredNode.attr('data-path')).addComponents(instance);
          } else {
            // if dropped in "nothing" then put it back into its old host node
            comp.remove();
            this.data('parentNode').addComponents(instance);
          }

          clearTimeout(this.data('dragTimeout'));

          this.removeData('parentNode');
          this.removeData('offset');
          this.removeData('hoveredNode');
          this.removeData('dragTimeout');
        });

      var children = host.selectAll('.instance[data-path="' + instance.eContainer().path() + '"] > .instance').items;
      var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
        dy = NODE_HEIGHT;
      children.forEach(function (child) {
        dy += child.select('.bg').asPX('height') + 10;
      });
      comp.transform('t' + dx + ',' + dy);
      host.append(comp);

      ui.updateValidity(instance);

      return comp;
    };
  });
