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
      return test(item.name, expr.content);
    }

    function name(items, expr) {
      return items.filter(function (item) {
        return atomicName(item, expr);
      });
    }

    function atomicIs(item, expr) {
      switch (expr.content) {
        case 'node':
          return item.type === 'node';

        case 'chan':
        case 'channel':
          return item.type === 'channel';

        case 'comp':
        case 'component':
          return item.type === 'component';

        case 'group':
        case 'grp':
          return item.type === 'group';

        case 'selected':
          return item.selected;

        case 'folded':
          return item.folded;

        default:
          return true;
      }
    }

    function is(items, expr) {
      return items.filter(function (item) {
        return atomicIs(item, expr);
      });
    }

    function atomicTag(item, expr) {
      return item.tags.some(function (tag) {
        return test(tag, expr.content);
      });
    }

    function tag(items, expr) {
      return items.filter(function (item) {
        return atomicTag(item, expr);
      });
    }

    function atomicVers(item, expr) {
      return test(item.version, expr.content);
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

      // return items.filter(function (item) {
      //   var isFilter = false, nameFilter = false, tagFilter = false,
      //       versFilter = false, andFilter = false, orFilter = false;
      //
      //   expr.content.forEach(function (expr) {
      //     switch (expr.type) {
      //       case 'is':
      //         isFilter = atomicIs(item, expr);
      //         break;
      //
      //       case 'name':
      //         nameFilter = atomicName(item, expr);
      //         break;
      //
      //       case 'vers':
      //         versFilter = atomicVers(item, expr);
      //         break;
      //
      //       case 'tag':
      //         tagFilter = atomicTag(item, expr);
      //         break;
      //     }
      //   });
      //
      //   return isFilter || nameFilter || tagFilter || versFilter ||
      //          andFilter || orFilter;
      // });
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
