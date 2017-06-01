'use strict';

angular.module('editorApp')
  .directive('instanceName', function (kEditor) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        instance: '&instance',
        instanceType: '&instanceType'
      },
      link: function (scope, elem, attrs, ctrl) {
        ctrl.$parsers.push(function checkUnicity(value) {
          var model = kEditor.getModel();
          var elem;

          switch (scope.instanceType()) {
            case 'node':
              elem = model.findNodesByID(value);
              break;
            case 'group':
              elem = model.findGroupsByID(value);
              break;
            case 'channel':
              elem = model.findHubsByID(value);
              break;
            case 'component':
              elem = scope.instance().eContainer().findComponentsByID(value);
              break;
          }

          if (elem) {
            // something has already this name
            if (elem.path() === scope.instance().path()) {
              // it is the same old value, everything is fine
              ctrl.$setValidity('notUniqueName', true);
            } else {
              // it matches another instance in the model => wrong
              ctrl.$setValidity('notUniqueName', false);
            }
          } else {
            // name is ok
            ctrl.$setValidity('notUniqueName', true);
          }
          return value;
        });
      }
    };
  });
