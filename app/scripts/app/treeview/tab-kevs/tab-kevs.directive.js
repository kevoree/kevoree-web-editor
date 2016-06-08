'use strict';

angular.module('editorApp')
  .directive('tabKevs', function () {
    return {
      restrict: 'AE',
      scope: {
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-kevs/tab-kevs.html',
      controller: function ($scope, $timeout, kEditor, kScript) {
        var changeId;
        $scope.message = null;
        $scope.inEditor = null;
        $scope.outEditor = null;
        $scope.inKevs = '';
        $scope.outKevs = '';
        $scope.options = {
          mode: 'kevscript',
          theme: 'kevscript',
          lineWrapping: true,
          lineNumbers: true,
          styleActiveLine: true,
          gutters: [ 'CodeMirror-lint-markers' ],
          lint: true
        };

        function transform() {
          var inLines = $scope.inEditor.getValue().split('\n');
          var outKevs = [];
          inLines.forEach(function (line) {
            if (line.indexOf('*') !== -1) {
              $scope.items.forEach(function (item) {
                if (item.type === 'component') {
                  outKevs.push(line.replace('*', item.kevsName));
                } else {
                  outKevs.push(line.replace('*', item.name));
                }
              });
            } else {
              outKevs.push(line);
            }
          });
          $scope.outKevs = outKevs.join('\n');
        }

        var unregister = $scope.$on('kevs-tab-selected', function () {
          $timeout(function () {
            $scope.inEditor.refresh();
            $scope.outEditor.refresh();
          }, 100);
        });

        var unwatch = $scope.$watchCollection('items', transform);

        $scope.$on('$destroy', function () {
          unregister();
          unwatch();
        });

        $scope.inOnLoad = function (e) {
          $scope.inEditor = e;
          $scope.inEditor.on('change', function () {
            $timeout.cancel(changeId);
            changeId = $timeout(transform, 200);
          });
        };
        $scope.outOnLoad = function (e) {
          $scope.outEditor = e;
        };

        $scope.execute = function () {
          kScript.parse($scope.outKevs, kEditor.getModel(), function (err, model) {
            if (err) {
              $scope.message = { type: 'danger', content: err.message };
            } else {
              $scope.message = { type: 'success', content: 'KevScript successfully applied to current model' };
              $scope.inKevs = '';
              kEditor.setModel(model);
            }
          });
        };
      }
    };
  });
