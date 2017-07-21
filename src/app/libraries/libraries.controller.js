'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:LibrariesCtrl
 * @description
 * # LibrariesCtrl
 * Controller of the editorApp registry libraries page
 */
angular.module('editorApp')
  .controller('LibrariesCtrl', function ($q, $uibModal, kRegistry, kEditor, kFactory, Notification) {
    var vm = this;
    vm.namespaces = [];
    vm.tdefs = [];
    vm.selectNs = selectNs;
    vm.selectTdef = selectTdef;
    vm.tdefDetail = null;
    vm.changeTdefVersion = changeTdefVersion;
    vm.addDusToModel = addDusToModel;

    // initial process: retrieve all namespaces from registry
    kRegistry.namespace.all()
      .then(function (namespaces) {
        vm.namespaces = namespaces.map(function (ns) {
          if (ns.name === 'kevoree') {
            ns.active = true;
          } else {
            ns.active = false;
          }
          return ns;
        });
      })
      .then(updateTdefs);

    function updateTdefs() {
      vm.tdefs = null;
      vm.tdefDetail = null;
      vm.tdefDetailVersions = null;
      var activeNs = vm.namespaces.find(function (ns) {
        return ns.active;
      });
      if (activeNs) {
        return getTdefsByNamespace(activeNs)
          .then(function () {
            return getTdefVersions(vm.tdefDetail);
          })
          .then(function () {
            return getTdefDus(vm.tdefDetail);
          });
      } else {
        return null;
      }
    }

    function getTdefsByNamespace(namespace) {
      return kRegistry.tdef.getLatestsByNamespace(namespace.name)
        .then(function (tdefs) {
          vm.tdefs = tdefs.map(function (tdef, i) {
            if (i === 0) {
              tdef.active = true;
              vm.tdefDetail = tdef;
            } else {
              tdef.active = false;
            }
            return tdef;
          });
        });
    }

    function getTdefVersions(tdef) {
      if (tdef) {
        return kRegistry.tdef.getAllByNamespaceAndName(tdef.namespace, tdef.name)
          .then(function (tdefs) {
            vm.tdefDetailVersions = tdefs;
          });
      } else {
        return null;
      }
    }

    function getTdefDus(tdef) {
      if (tdef) {
        return $q.all([
          kRegistry.du.getReleases(tdef.namespace, tdef.name, tdef.version),
          kRegistry.du.getLatests(tdef.namespace, tdef.name, tdef.version)
        ]).then(function (results) {
          vm.tdefDetail.releases = transformDUS(results[0]);
          vm.tdefDetail.latests = transformDUS(results[1]);
        });
      } else {
        return null;
      }
    }

    function selectNs(nsClicked) {
      vm.disabled = true;
      vm.namespaces.forEach(function (ns) {
        if (ns.name === nsClicked.name) {
          ns.active = !ns.active;
        } else {
          ns.active = false;
        }
      });
      updateTdefs()
        .then(function () {
          vm.disabled = false;
        });
    }

    function selectTdef(tdefClicked) {
      vm.disabled = true;
      vm.tdefDetail = null;
      vm.tdefDetailVersions = null;
      vm.tdefs.forEach(function (tdef) {
        if (tdef.name === tdefClicked.name) {
          tdef.active = !tdef.active;
        } else {
          tdef.active = false;
        }
      });
      vm.tdefDetail = vm.tdefs.find(function (tdef) {
        return tdef.active;
      });
      changeTdefVersion(vm.tdefDetail)
        .then(function () {
          vm.disabled = false;
        });
    }

    function transformDUS(dus) {
      dus.sort(function (a, b) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
      return dus.map(function (du) {
        du.active = false;
        return du;
      });
    }

    function changeTdefVersion(tdef) {
      if (tdef) {
        vm.tdefDetail = tdef;
        return getTdefVersions(tdef)
          .then(function () {
            return getTdefDus(tdef);
          });
      } else {
        return $q.resolve();
      }
    }

    function addDusToModel(dus) {
      var model = kEditor.getModel();
      var tdef = model.select('/packages['+vm.tdefDetail.namespace+']/typeDefinitions[name='+vm.tdefDetail.name+',version='+vm.tdefDetail.version+']').array[0];
      if (tdef) {
        $uibModal.open({
          templateUrl: 'app/libraries/dus.modal.html',
          size: 'md',
          resolve: {
            tdef: function () {
              return vm.tdefDetail;
            },
            currentDus: function () {
              return tdef.deployUnits.array;
            },
            dus: function () {
              return dus;
            }
          },
          controller: 'DusModalController as vm'
        }).result.then(function () {
          // delete the previous deployUnits of the typeDef
          tdef.deployUnits.array = [];
          mergeDUSInModel(tdef, dus);
          Notification.success({
            title: 'Add to model',
            message: 'DeployUnits successfully added to <strong>'+tdef.eContainer().name+'.'+tdef.name+'/'+tdef.version+'</strong>'
          });
        });
      } else {
        // no trace of typeDef in current model
        var pkg = model.findPackagesByID(vm.tdefDetail.namespace);
        if (!pkg) {
          // namespace is not in model yet: add it
          pkg = kFactory.createPackage().withName(vm.tdefDetail.namespace);
          model.addPackages(pkg);
        }
        pkg.addTypeDefinitions(vm.tdefDetail.model);
        tdef = model.select('/packages['+vm.tdefDetail.namespace+']/typeDefinitions[name='+vm.tdefDetail.name+',version='+vm.tdefDetail.version+']').array[0];
        mergeDUSInModel(tdef, dus);
        Notification.success({
          title: 'Add to model',
          message: '<strong>'+tdef.eContainer().name+'.'+tdef.name+'/'+tdef.version+'</strong> successfully added to model'
        });
      }
    }

    function mergeDUSInModel(tdef, dus) {
      dus.forEach(function (du) {
        if (!du.error) {
          // add DeployUnits to package
          tdef.eContainer().addDeployUnits(du.model);
          // add DeployUnits to typedef
          tdef.addDeployUnits(du.model);
        }
      });
    }
  });
