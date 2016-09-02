'use strict';

angular.module('editorApp')
  .run(function () {
    var STATEMENTS = ['add', 'attach', 'bind', 'detach', 'move', 'network', 'start', 'stop', 'remove', 'set', 'unbind'];
    var STATEMENTS_REGEX = /^(\s*)\b(add|repo|include|remove|move|set|attach|detach|network|bind|unbind|start|stop|pause)\b/;

    function createElement(data) {
      return {
        text: data.text,
        className: 'cm-kevs-hint-elem',
        closeOnUnfocus: false,
        render: function (elem) {
          elem = angular.element(elem)
            .append(angular.element('<span class="type '+data.type+'"></span>')
                .append(data.type.substr(0, 1)))
            .append(angular.element('<span class="text"></span>')
                .append(data.text));
          if (data.desc) {
            elem.siblings('.desc').html(data.desc);
          }
        }
      };
    }

    function createElemData(type, desc) {
      return function (elem) {
        return {
          type: type,
          text: elem.name,
          desc: desc
        };
      };
    }

    function getAttributes(instance) {
      if (instance.dictionary) {
        return instance.dictionary.values.array.map(createElemData('attr'));
      }
      return [];
    }

    function findRootInstanceByName(name, model) {
      if (model) {
        var instance = model.findNodesByID(name);
        if (instance) {
          return instance;
        }
        instance = model.findGroupsByID(name);
        if (instance) {
          return instance;
        }
        instance = model.findHubsByID(name);
        if (instance) {
          return instance;
        }
      }
      return null;
    }

    function getInstance(path, model) {
      if (model) {
        if (path.length === 0) {
          return model;
        } else {
          if (path.length === 1) {
            return findRootInstanceByName(path[0], model);
          } else if (path.length === 2) {
            var node = model.findNodesByID(path[0]);
            if (node) {
              return node.findComponentsByID(path[1]);
            }
          }
        }
      }
      return null;
    }

    function getInstances(instance) {
      if (instance.metaClassName() === 'org.kevoree.ContainerRoot') {
        return instance.nodes.array.map(createElemData('node'))
          .concat(instance.groups.array.map(createElemData('group')))
          .concat(instance.hubs.array.map(createElemData('chan')));
      }
      return [];
    }

    function getComponents(instance) {
      if (instance.metaClassName() === 'org.kevoree.ContainerNode') {
        return instance.components.array.map(createElemData('comp'));
      }
      return [];
    }

    function getBindings(instance) {
      if (instance.metaClassName() === 'org.kevoree.ComponentInstance') {
        return instance.provided.array.map(createElemData('input'))
          .concat(instance.required.array.map(createElemData('output')));
      }
      return [];
    }

    CodeMirror.registerHelper('hint', 'kevscript', function (cm) {
      var cursor  = cm.getCursor(),
        token   = cm.getTokenAt(cursor),
        line = cm.getLine(cursor.line),
        lineStart = line.substr(0, token.end),
        list  = [],
        match = STATEMENTS_REGEX.exec(lineStart);

      console.log('cursor=', cursor);
      console.log('token=', token);

      if (match) {
        var statement = match[2];
        // in a statement
        console.log('statement=', statement);
        // trying to access/add on instance
        var path = token.string.split('.').filter(function (str) { return str.trim().length > 0; });
        if (path.length === 1 && path[0].length === 0) {
          path = [];
        }
        console.log('path=', path);
        var instance;
        switch (statement) {
          case 'set':
            instance = getInstance(path, cm.options.lint.lintedModel);
            if (instance) {
              list = getComponents(instance)
                .concat(getInstances(instance))
                .concat(getAttributes(instance));
            }
            break;

          case 'bind':
          case 'unbind':
            instance = getInstance(path, cm.options.lint.lintedModel);
            if (instance) {
              list = getComponents(instance)
                .concat(getInstances(instance))
                .concat(getBindings(instance))
                .filter(function (elem) {
                  console.log('filter', elem, path);
                  if (path.length === 0) {
                    return elem.type === 'node';
                  } else if (path.length === 1) {
                    return elem.type === 'comp';
                  } else if (path.length === 2) {
                    return elem.type === 'input' || elem.type === 'output';
                  }
                });
            }
            break;

          case 'add':
            if (token.type === 'delimiter') {
              list = [
                createElemData('version')({ name: 'LATEST' }),
                createElemData('version')({ name: 'RELEASE' })
              ];
            }
            break;
        }
      } else {
        // blank new line
        if (token.type !== 'comment') {
          // not a comment line
          list = STATEMENTS.map(function (stat) {
            return {
              type: 'statement',
              text: stat
            };
          });
        }
      }

      return {
        list: list.map(createElement),
        from: CodeMirror.Pos(cursor.line, cursor.ch),
        to: CodeMirror.Pos(cursor.line, token.end)
      };
    });
  });
