'use strict';

angular.module('editorApp')
  .factory('ui', function (util, uiUtils, uiCreateGroup, uiCreateGroupWire, uiCreateNode, uiCreateComponent, uiCreateBinding, uiCreateChannel, kModelHelper, kFactory, Notification, KWE_POSITION, NODE_WIDTH, NODE_HEIGHT, INVALID_RADIUS, GROUP_RADIUS, CHANNEL_RADIUS) {

    var ui = {
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
       * Mouse position holder
       */
      mousePos: {
        x: 0,
        y: 0
      },

      /**
       * Must be called before any other methods
       */
      init: function () {
        var editor = new Snap('svg#editor');
        editor.zpd({
          zoomThreshold: [0.2, 1],
          zoomScale: 0.05
        });
        var zpdEditor = this.editor = editor.select('#snapsvg-zpd-' + editor.id);
        zpdEditor.addClass('zpd');
        editor.mousedown(function (evt) {
          if (evt.which === 1) {
            // remove all selected state
            editor.selectAll('.selected')
              .forEach(function (elem) {
                elem.removeClass('selected');
                var path = elem.parent().attr('data-path');
                if (path && path.length > 0) {
                  var instance = ui.model.findByPath(path);
                  kModelHelper.setSelected(instance, false);
                }
              });
          }
        });
        uiUtils.updateSVGDefs(this.model);

        // create an observer instance
        var observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.attributeName === 'transform') {
              var matrix = zpdEditor.transform()
                .localMatrix;
              editor
                .select('#coord-text')
                .attr({
                  text: '(' + parseInt(matrix.e, 10) + ', ' + parseInt(matrix.f, 10) + ') ' + parseInt(matrix.a * 100, 10) + '%'
                });
            }
          });
        });

        // pass in the target node, as well as the observer options
        observer.observe(zpdEditor.node, {
          attributes: true,
          childList: false,
          characterData: false
        });

        editor.dblclick(function () {
          zpdEditor.animate({
            transform: 's1,t0,0'
          }, 400, mina.ease);
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

      createGroup: function (instance) {
        uiCreateGroup(this, instance);
      },

      createGroupWire: function (group, node) {
        uiCreateGroupWire(this, group, node);
      },

      createNode: function (instance) {
        uiCreateNode(this, instance);
      },

      createComponent: function (instance) {
        return uiCreateComponent(this, instance);
      },

      createBinding: function (instance) {
        uiCreateBinding(this, instance);
      },

      createChannel: function (instance) {
        uiCreateChannel(this, instance);
      },

      updateValidity: function (instance) {
        if (this.editor) {
          var elem = this.editor.select('.instance[data-path="' + instance.path() + '"]');
          var icon = this.editor.select('.instance[data-path="' + instance.path() + '"] > .invalid-icon');
          if (kModelHelper.isValid(instance)) {
            if (icon) {
              icon.remove();
            }
          } else {
            if (icon) {
              icon.remove();
            }
            icon = this.editor
              .circle(0, 0, INVALID_RADIUS)
              .attr({
                'class': 'invalid-icon',
                fill: 'red',
                stroke: 'black',
                title: 'Invalid dictionary attributes'
              });
            var matrix = icon.transform()
              .localMatrix;
            switch (kModelHelper.getTypeDefinitionType(instance.typeDefinition)) {
              case 'node':
                matrix.e = elem.getBBox()
                  .width - (INVALID_RADIUS * 2);
                matrix.f = INVALID_RADIUS * 2;
                break;

              case 'group':
                matrix.f = -GROUP_RADIUS + (INVALID_RADIUS * 2);
                break;

              case 'channel':
                matrix.f = -CHANNEL_RADIUS + (INVALID_RADIUS * 2);
                break;

              case 'component':
                matrix.e = elem.getBBox()
                  .width;
                break;
            }
            icon.transform(matrix);
            elem.append(icon);
          }
        }
      },

      deleteInstance: function (parent, path) {
        var elem = this.editor.select('.instance[data-path="' + path + '"]');
        if (elem) {
          if (elem.hasClass('comp') || elem.hasClass('node')) {
            var highestNodePath = uiUtils.getHighestNodePath(elem);
            if (ui.draggedInstancePath === path) {
              // append it to the editor
              this.editor.append(elem);
            } else {
              this.editor.selectAll('.group-wire[data-to="' + path + '"]')
                .remove();
              elem.remove();
            }

            ui.refreshNode(highestNodePath);

            // refresh all group-wire from this whole node
            var highestNode = ui.model.findByPath(highestNodePath);
            if (highestNode) {
              highestNode.groups.array.forEach(function (group) {
                ui.createGroupWire(group, highestNode);
              });
              highestNode.hosts.array.forEach(function redrawWire(child) {
                child.groups.array.forEach(function (group) {
                  ui.createGroupWire(group, child);
                });
                child.hosts.array.forEach(redrawWire);
              });

              // redraw parent bindings
              highestNode.components.array.forEach(function (comp) {
                comp.provided.array.forEach(function (port) {
                  port.bindings.array.forEach(function (binding) {
                    ui.createBinding(binding);
                  });
                });
                comp.required.array.forEach(function (port) {
                  port.bindings.array.forEach(function (binding) {
                    ui.createBinding(binding);
                  });
                });
              });

              // redraw sibling bindings
              highestNode.hosts.array.forEach(function redrawBindings(child) {
                child.components.array.forEach(function (comp) {
                  comp.provided.array.forEach(function (port) {
                    port.bindings.array.forEach(function (binding) {
                      ui.createBinding(binding);
                    });
                  });
                  comp.required.array.forEach(function (port) {
                    port.bindings.array.forEach(function (binding) {
                      ui.createBinding(binding);
                    });
                  });
                });
                child.hosts.array.forEach(redrawBindings);
              });
            }
          } else {
            elem.remove();
          }
        }
      },

      deleteGroupWire: function (groupPath, nodePath) {
        var elem = this.editor.select('.group-wire[data-from="' + groupPath + '"][data-to="' + nodePath + '"]');
        if (elem) {
          elem.remove();
        }
      },

      deleteBinding: function (bindingPath) {
        var elem = this.editor.select('.binding[data-path="' + bindingPath + '"]');
        if (elem) {
          elem.remove();
        }
      },

      deleteSelected: function () {
        var selected = this.getSelected();
        selected.forEach(function (elem) {
          var path = elem.attr('data-path');
          if (path) {
            var instance = ui.model.findByPath(path);
            if (instance) {
              var readOnly = false;
              if (typeof instance.findMetaDataByID === 'function') {
                var val = instance.findMetaDataByID('access_mode');
                readOnly = (val && val.value === 'read-only');
              }
              if (readOnly) {
                Notification.warning({
                  title: 'Delete instance',
                  message: 'Cannot delete read-only instance "' + instance.name + '"',
                  delay: 3000
                });
              } else {
                if (instance.hosts) {
                  // also remove child nodes recursively
                  instance.hosts.array.forEach(function deleteChild(node) {
                    node.hosts.array.forEach(deleteChild);
                    node.delete();
                  });
                }
                instance.delete();
              }
            }
          } else {
            if (elem.hasClass('group-wire')) {
              var grp = ui.model.findByPath(elem.attr('data-from')),
                node = ui.model.findByPath(elem.attr('data-to'));
              if (node && grp) {
                node.removeGroups(grp);
                grp.removeSubNodes(node);
              }
            } else {
              // TODO for component ports wire
            }
          }
        });
        return selected.length;
      },

      removeUIElem: function (path) {
        var elem = this.editor.select('.instance[data-path="' + path + '"]');
        if (elem) {
          elem.remove();
        }
      },

      deleteNodes: function () {
        this.editor.selectAll('.node')
          .remove();
        this.editor.selectAll('.group-wire')
          .remove();
      },

      deleteGroups: function () {
        this.editor.selectAll('.group')
          .remove();
        this.editor.selectAll('.group-wire')
          .remove();
      },

      deleteChannels: function () {
        this.editor.selectAll('.chan')
          .remove();
      },

      deleteBindings: function () {
        this.editor.selectAll('.binding')
          .remove();
      },

      updateInstance: function (previousPath, instance) {
        var elem = this.editor.select('.instance[data-path="' + previousPath + '"]');
        if (elem) {
          // update data-path and name
          elem.attr({
            'data-path': instance.path()
          });
          var name = elem.select('text.name');
          if (name) {
            name.attr({
              text: instance.name
            });
          }

          // update location only if not a child of someone
          if (!elem.parent()
            .hasClass('node')) {
            elem.relocate(instance);
          }

          // update children data-path if any
          if (instance.components || instance.hosts) {
            instance.components.array.forEach(function (comp) {
              var compElem = elem.select('.instance[data-path="' + previousPath + '/components[' + comp.name + ']"]');
              if (compElem) {
                compElem.attr({
                  'data-path': comp.path()
                    .replace(previousPath, instance.path())
                });
              }
            });
          }

          // update started state
          if (elem.hasClass('comp')) {
            elem.select('.bg')
              .attr({
                fillOpacity: util.isTruish(instance.started) ? 1 : 0.65
              });
          } else {
            if (name) {
              name.attr({
                fill: util.isTruish(instance.started) ? '#fff' : '#000'
              });
            }
          }

          // update group-wire if it is a node
          if (elem.hasClass('node')) {
            this.editor
              .selectAll('.group-wire[data-to="' + previousPath + '"]')
              .attr({
                'data-to': instance.path()
              });
          }

          if (elem.hasClass('group')) {
            this.editor
              .selectAll('.group-wire[data-from="' + previousPath + '"]')
              .attr({
                'data-from': instance.path()
              });
          }
        }
      },

      updatePosition: function (instance) {
        var elem = this.editor.select('.instance[data-path="' + instance.path() + '"]');
        if (elem) {
          if (!elem.parent()
            .hasClass('node')) {
            elem.relocate(instance);
          }
        }
      },

      updateCompTypeDefinition: function (comp, oldTypeDef) {
        oldTypeDef.required.array.forEach(function (oldPortType) {
          var found = false;
          comp.typeDefinition.required.array.forEach(function (portType) {
            if (portType.name === oldPortType.name) {
              found = true;
              // port still exists in new typeDef
              var port = comp.findRequiredByID(portType.name);
              if (port) {
                port.portTypeRef = portType;
              }
            }
          });
          if (!found) {
            var port = comp.findRequiredByID(oldPortType.name);
            if (port) {
              port.bindings.array.forEach(function (binding) {
                binding.delete();
              });
              port.delete();
            }
          }
        });

        oldTypeDef.provided.array.forEach(function (oldPortType) {
          var found = false;
          comp.typeDefinition.provided.array.forEach(function (portType) {
            if (portType.name === oldPortType.name) {
              found = true;
              // port still exists in new typeDef
              var port = comp.findProvidedByID(oldPortType.name);
              if (port) {
                port.portTypeRef = portType;
              }
            }
          });
          if (!found) {
            var port = comp.findProvidedByID(oldPortType.name);
            if (port) {
              port.bindings.array.forEach(function (binding) {
                binding.delete();
              });
              port.delete();
            }
          }
        });

        // recreate the new component
        var compUi = ui.createComponent(comp);
        compUi.select('.bg')
          .addClass('selected');
        this.refreshNode(comp.eContainer()
          .path());
      },

      toggleFold: function (node, isFolded) {
        function toggleChannel(chan) {
          var uiChan = ui.editor.select('.chan[data-path="' + chan.path() + '"]');
          if (uiChan) {
            if (kModelHelper.isChannelDistributed(chan)) {
              if (isFolded) {
                uiChan.attr({
                  strokeDasharray: '5 3'
                });
              } else {
                uiChan.attr({
                  strokeDasharray: ''
                });
              }
            } else {
              if (isFolded) {
                uiChan.addClass('hide');
              } else {
                uiChan.removeClass('hide');
              }
            }
          }
        }

        function toggleBinding(binding) {
          if (binding.hub) {
            toggleChannel(binding.hub);
          }

          var uiBinding = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
          if (uiBinding) {
            if (isFolded) {
              uiBinding.addClass('hide');
            } else {
              uiBinding.removeClass('hide');
            }
          }
        }

        function togglePort(port) {
          port.bindings.array.forEach(toggleBinding);
        }

        function toggleComp(comp) {
          comp.provided.array.forEach(togglePort);
          comp.required.array.forEach(togglePort);

          var uiComp = ui.editor.select('.comp[data-path="' + comp.path() + '"]');
          if (uiComp) {
            if (isFolded) {
              uiComp.addClass('hide');
            } else {
              uiComp.removeClass('hide');
            }
          }
        }

        function toggleSubNodes(node) {
          node.components.array.forEach(toggleComp);
          node.hosts.array.forEach(toggleSubNodes);

          var uiNode = ui.editor.select('.node[data-path="' + node.path() + '"]');
          if (uiNode) {
            if (isFolded) {
              uiNode.addClass('hide');
            } else {
              uiNode.removeClass('hide');
            }
          }
        }

        node.components.array.forEach(toggleComp);
        node.hosts.array.forEach(toggleSubNodes);

        var uiNode = ui.editor.select('.node[data-path="' + node.path() + '"]');
        if (uiNode) {
          if (isFolded) {
            uiNode.select('.bg')
              .attr({
                height: NODE_HEIGHT,
                strokeDasharray: '5 3'
              });
          } else {
            uiNode.select('.bg')
              .attr({
                height: uiUtils.getNodeUIHeight(node),
                strokeDasharray: ''
              });
          }
        }
      },

      /**
       * Refresh a node's UI (and it's children too)
       * @param path
       */
      refreshNode: function (path) {
        var instance = ui.model.findByPath(path);
        if (instance) {
          var node = ui.editor.select('.node[data-path="' + path + '"]');
          var treeHeight = kModelHelper.getNodeTreeHeight(instance);
          var computedWidth = NODE_WIDTH + (20 * treeHeight);
          if (instance.host) {
            computedWidth = NODE_WIDTH + (20 * (kModelHelper.getNodeTreeHeight(instance.host) - 1));
          }

          node.relocate(instance);

          node.select('.bg')
            .attr({
              width: computedWidth,
              height: uiUtils.getNodeUIHeight(instance)
            });

          ui.editor
            .selectAll('.node[data-path="' + path + '"] > text')
            .attr({
              x: computedWidth / 2,
              'clip-path': 'url(#node-clip-' + treeHeight + ')'
            });

          instance.components.array.forEach(function (comp) {
            ui.refreshComp(comp.path());
          });

          instance.hosts.array.forEach(function (host) {
            ui.refreshNode(host.path());
          });

          // apply dx,dy transformation of level-1 children
          var children = ui.editor.selectAll('.node[data-path="' + instance.path() + '"] > .instance')
            .items;
          var dy = NODE_HEIGHT;
          children.forEach(function (child) {
            child.transform('t' + ((computedWidth - child.select('.bg')
              .asPX('width')) / 2) + ',' + dy);
            dy += child.select('.bg')
              .asPX('height') + 10;
          });

          instance.components.array.forEach(function (comp) {
            comp.provided.array.forEach(function (port) {
              port.bindings.array.forEach(function (binding) {
                ui.createBinding(binding);
              });
            });
            comp.required.array.forEach(function (port) {
              port.bindings.array.forEach(function (binding) {
                ui.createBinding(binding);
              });
            });
          });

          this.updateValidity(instance);
        }
      },

      /**
       *
       * @param path
       */
      refreshComp: function (path) {
        var instance = ui.model.findByPath(path);
        if (instance) {
          var comp = ui.editor.select('.comp[data-path="' + path + '"]');
          var host = ui.editor.select('.node[data-path="' + instance.eContainer()
            .path() + '"]');
          var treeHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
          var computedWidth = host.select('.bg')
            .asPX('width') - 20;

          if (comp && host) {
            comp.select('.bg')
              .attr({
                width: computedWidth
              });
            ui.editor
              .selectAll('.comp[data-path="' + path + '"] > text')
              .attr({
                x: computedWidth / 2,
                'clip-path': 'url(#comp-clip-' + treeHeight + ')'
              });

            var PORT_X_PADDING = 3;
            instance.typeDefinition.required.array.forEach(function (portType) {
              var port = comp.select('.required[data-name="' + portType.name + '"]');
              port.transform('t' + (computedWidth - PORT_X_PADDING) + ',' + port.transform()
                .localMatrix.f);
            });

            this.updateValidity(instance);
          }
        } else {
          this.createComponent(instance);
        }
      },

      getSelected: function () {
        return this.editor
          .selectAll('.selected')
          .items
          .map(function (elem) {
            // all selected element are in groups so we need to return the parent
            return elem.parent();
          });
      },

      getSelectedPaths: function () {
        return this.getSelected()
          .map(function (elem) {
            return elem.attr('data-path');
          });
      },

      getSelectedNodes: function () {
        return this.editor
          .selectAll('.node > .selected')
          .items
          .map(function (bg) {
            return bg.parent();
          });
      },

      getNodePathAtPoint: function (x, y) {
        var container = this.getEditorContainer();
        var node = ui.getHoveredNode(x - container.offsetLeft, y - container.offsetTop);
        if (node) {
          return node.attr('data-path');
        } else {
          return null;
        }
      },

      getEditorContainer: function () {
        return document.getElementById('editor-container');
      },

      selectAll: function () {
        this.editor.selectAll('.bg')
          .items.forEach(function (elem) {
            elem.addClass('selected');
          });
      },

      isSelected: function (path) {
        var elem = this.editor.select('.instance[data-path="' + path + '"]');
        if (elem) {
          if (elem.select('.bg')
            .hasClass('selected')) {
            return true;
          }
        }

        return false;
      },

      setDropTarget: function (elem) {
        this.dropTarget = elem;
      },

      getDropTarget: function () {
        return this.dropTarget;
      },

      setModel: function (model) {
        this.model = model;
        if (this.editor) {
          uiUtils.updateSVGDefs(model);

          this.editor.clear();
        }
      },

      getHoveredNode: function (x, y, bannedPath) {
        var m = this.editor.transform()
          .localMatrix;
        return this.editor
          .selectAll('.node')
          .items
          .filter(function (node) {
            if (bannedPath) {
              return node.attr('data-path') !== bannedPath &&
                uiUtils.isPointInsideElem(node, x, y, m);
            } else {
              return uiUtils.isPointInsideElem(node, x, y, m);
            }
          })
          .sort(function (a, b) {
            return a.getBBox()
              .width - b.getBBox()
              .width;
          })[0];
      },

      getHoveredChan: function (x, y) {
        var chans = this.editor
          .selectAll('.chan')
          .items;
        for (var i = 0; i < chans.length; i++) {
          if (Snap.path.isPointInsideBBox(chans[i].getBBox(), x, y)) {
            return chans[i];
          }
        }
        return null;
      },

      getHoveredPort: function (x, y) {
        var ports = this.editor
          .selectAll('.port')
          .items;
        for (var i = 0; i < ports.length; i++) {
          if (uiUtils.isPointInsideElem(ports[i], x, y, this.editor.transform()
              .localMatrix)) {
            return ports[i];
          }
        }
        return null;
      },

      hasErrors: function () {
        return this.editor.selectAll('.invalid-icon')
          .length > 0;
      },

      order: function () {
        this.editor.selectAll('.binding')
          .forEach(function (binding) {
            binding.node.parentNode.appendChild(binding.node);
          });
      }
    };

    /**
     *
     */
    Snap.plugin(function (Snap, Element) {
      var dragStart = function (x, y, evt) {
        if (!this.parent()
          .hasClass('instance')) {
          var instances = angular.element(ui.editor.node)
            .find('> .instance');
          this.node.parentNode.insertBefore(this.node, instances[instances.length - 1].nextSibling);
        }

        this.data('dragStartX', x);
        this.data('dragStartY', y);

        ui.draggedInstancePath = this.attr('data-path');

        var handlers = this.data('dragStart');
        if (handlers) {
          handlers.forEach(function (handler) {
            handler.apply(this, [x, y, evt]);
          }.bind(this));
        }

        if (this.hasClass('comp') || this.hasClass('node')) {
          var bbox = uiUtils.getAbsoluteBBox(this);
          this.data('ot', 't' + bbox.x + ',' + bbox.y);
        } else {
          this.data('ot', this.transform()
            .local);
        }

        this.data('hasMoved', false);
      };

      var dragMove = function (dx, dy, x, y, evt) {
        var dragStartX = this.data('dragStartX'),
          dragStartY = this.data('dragStartY');
        if (typeof dragStartX !== 'undefined' && typeof dragStartY !== 'undefined') {
          if ((typeof dx === 'object') && (dx.type === 'touchmove')) {
            evt = dx;
            x = evt.changedTouches[0].clientX;
            y = evt.changedTouches[0].clientY;
            dx = x - dragStartX;
            dy = y - dragStartY;
          }

          this.transform(this.data('ot') + (this.data('ot') ? 'T' : 't') + [dx, dy]);

          if (this.data('hasMoved')) {
            var handlers = this.data('dragMove');
            if (handlers) {
              handlers.forEach(function (handler) {
                handler.apply(this, [dx, dy, x, y, evt]);
              }.bind(this));
            }
          } else {
            this.data('hasMoved', true);
            var firstDragMoveHandlers = this.data('firstDragMove');
            if (firstDragMoveHandlers) {
              firstDragMoveHandlers.forEach(function (handler) {
                handler.apply(this, [dx, dy, x, y, evt]);
              }.bind(this));
            }
          }
        }
      };

      var dragEnd = function () {
        var args = arguments;
        if (this.data('hasMoved')) {
          // update position
          var instance = ui.model.findByPath(this.attr('data-path'));
          if (instance) {
            // update model with new position on drag end
            var pos = instance.findMetaDataByID(KWE_POSITION);
            if (!pos) {
              pos = kFactory.createValue();
              pos.name = KWE_POSITION;
              instance.addMetaData(pos);
            }
            var matrix = this.transform()
              .localMatrix;
            pos.value = JSON.stringify({
              x: matrix.e,
              y: matrix.f
            });
          }

          // trigger handlers
          var handlers = this.data('dragEnd');
          if (handlers) {
            handlers.forEach(function (handler) {
              handler.apply(this, args);
            }.bind(this));
          }

          this.data('hasMoved', false);
        }
        this.removeData('dragStartX');
        this.removeData('dragStartY');
        this.removeData('ot');
        ui.draggedInstancePath = null;
      };

      Element.prototype.draggable = function () {
        return this.drag(function (dx, dy, x, y, evt) {
          if (evt.which === 1) {
            dragMove.apply(this, arguments);
          }
        }, function (x, y, evt) {
          if (evt.which === 1) {
            dragStart.apply(this, arguments);
          }
        }, function (evt) {
          if (evt.which === 1) {
            dragEnd.apply(this, arguments);
          }
        });
      };

      Element.prototype.dragStart = function (handler) {
        var handlers = this.data('dragStart') || [];
        handlers.push(handler);
        return this.data('dragStart', handlers);
      };

      Element.prototype.dragEnd = function (handler) {
        var handlers = this.data('dragEnd') || [];
        handlers.push(handler);
        return this.data('dragEnd', handlers);
      };

      Element.prototype.dragMove = function (handler) {
        var handlers = this.data('dragMove') || [];
        handlers.push(handler);
        return this.data('dragMove', handlers);
      };

      Element.prototype.startPtDrag = function (handler) {
        return this.data('startPtDrag', handler);
      };

      Element.prototype.endPtDrag = function (handler) {
        return this.data('endPtDrag', handler);
      };

      Element.prototype.firstDragMove = function (handler) {
        var handlers = this.data('firstDragMove') || [];
        handlers.push(handler);
        return this.data('firstDragMove', handlers);
      };

      Element.prototype.selectable = function (instance) {
        var selectable = function (evt) {
          if (evt.which === 1) {
            evt.cancelBubble = true;

            if (!evt.ctrlKey && !evt.shiftKey) {
              ui.editor.selectAll('.selected')
                .forEach(function (elem) {
                  elem.removeClass('selected');
                  var path = elem.parent().attr('data-path');
                  if (path && path.length > 0) {
                    var instance = ui.model.findByPath(path);
                    kModelHelper.setSelected(instance, false);
                  }
                });
            }
            if (evt.ctrlKey || evt.shiftKey) {
              this.select('.bg')
                .toggleClass('selected');
              if (this.select('.bg')
                .hasClass('selected')) {
                kModelHelper.setSelected(instance, true);
              } else {
                kModelHelper.setSelected(instance, false);
              }

            } else {
              this.select('.bg')
                .addClass('selected');
              kModelHelper.setSelected(instance, true);
            }
          }
        };

        return this
          .mousedown(selectable)
          .touchstart(selectable);
      };

      Element.prototype.relocate = function (instance) {
        var meta = instance.findMetaDataByID(KWE_POSITION);
        var pos = {
          x: 100,
          y: 100
        };
        if (meta) {
          try {
            pos = JSON.parse(meta.value);
          } catch (ignore) {
            pos = {
              x: 100,
              y: 100
            };
          }
        } else {
          meta = kFactory.createValue();
          meta.name = KWE_POSITION;
          meta.value = JSON.stringify(pos);
          instance.addMetaData(meta);
        }
        return this.transform('t' + pos.x + ',' + pos.y);
      };
    });

    return ui;
  });
