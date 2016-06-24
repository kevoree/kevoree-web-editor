'use strict';

angular.module('editorApp')
  .filter('doFilter', function () {
    var query = function () {};

    function test(expected, actual) {
      if (actual.type && actual.type === 'regex') {
        return actual.content.test(expected);
      } else {
        return expected === actual;
      }
    }

    function atomicName(item, expr) {
      var match = test(item.name, expr.content);
      if (!match && item.children) {
        return item.children.some(function (child) {
          return test(child.name, expr.content);
        });
      }
      return match;
    }

    function name(items, expr) {
      return items.filter(function (item) {
        return atomicName(item, expr);
      });
    }

    function atomicIs(item, expr) {
      var match;
      switch (expr.content) {
        case 'node':
          match = item.type === 'node';
          break;

        case 'chan':
        case 'channel':
          match = item.type === 'channel';
          break;

        case 'comp':
        case 'component':
          match = item.type === 'component';
          break;

        case 'group':
        case 'grp':
          match = item.type === 'group';
          break;

        case 'selected':
          match = item.selected;
          break;

        case 'folded':
          match = item.folded;
          break;

        default:
          match = false;
          break;
      }

      if (!match && item.children) {
        return item.children.some(function (child) {
          return atomicIs(child, expr);
        });
      }
      return match;
    }

    function is(items, expr) {
      return items.filter(function (item) {
        return atomicIs(item, expr);
      });
    }

    function atomicTag(item, expr) {
      var match = item.tags.some(function (tag) {
        return test(tag, expr.content);
      });

      if (!match && item.children) {
        return item.children.some(function (child) {
          return atomicTag(child, expr);
        });
      }
      return match;
    }

    function tag(items, expr) {
      return items.filter(function (item) {
        return atomicTag(item, expr);
      });
    }

    function atomicVers(item, expr) {
      var match = test(item.version, expr.content);

      if (!match && item.children) {
        return item.children.some(function (child) {
          return atomicVers(child, expr);
        });
      }
      return match;
    }

    function vers(items, expr) {
      return items.filter(function (item) {
        return atomicVers(item, expr);
      });
    }

    function and(items, expr) {
      var filtered = items;
      expr.content.forEach(function (expr) {
        filtered = query(filtered, expr);
      });
      return filtered;
    }

    function or(items, expr) {
      var alreadyFiltered = [];
      var filtered = [];
      expr.content.forEach(function (expr) {
        var notAddedItems = items.filter(function (item) {
          return alreadyFiltered.indexOf(item.path) === -1;
        });
        var toAdd = query(notAddedItems, expr);
        toAdd.forEach(function (item) {
          if (alreadyFiltered.indexOf(item.path) === -1) {
            alreadyFiltered.push(item.path);
          }
        });
        filtered = filtered.concat(toAdd);
      });
      return filtered;
    }

    query = function (items, expr) {
      if (items) {
        if (expr) {
          switch (expr.type) {
            case 'name':
              return name(items, expr);

            case 'is':
              return is(items, expr);

            case 'tag':
              return tag(items, expr);

            case 'vers':
              return vers(items, expr);

            case 'and':
              return and(items, expr);

            case 'or':
              return or(items, expr);

            default:
            return items;
          }
        } else {
          return items;
        }
      }
    };

    return query;
  });
