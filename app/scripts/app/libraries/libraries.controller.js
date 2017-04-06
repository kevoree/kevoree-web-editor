'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:LibrariesCtrl
 * @description
 * # LibrariesCtrl
 * Controller of the editorApp registry libraries page
 */
angular.module('editorApp')
	.controller('LibrariesCtrl', function ($scope, $timeout, kRegistry, kModelHelper, kFactory, kEditor) {
		$scope.loading = true;
		$scope.groups = [];
		$scope.nodes = [];
		$scope.channels = [];
		$scope.components = [];
		$scope.tdefSearch = {
			name: '',
			namespace: '',
			platform: ''
		};
		$scope.selection = [];

		$scope.getUrl = function () {
			var url = kRegistry.getUrl()
				.toString();
			if (url.endsWith('/')) {
				return url.substr(0, url.length - 1);
			}
			return url;
		};

		kRegistry
			.getAll()
			.then(function (tdefs) {
				$timeout(function () {
					tdefs.forEach(function (tdef) {
						if (tdef.type === 'org.kevoree.GroupType') {
							$scope.groups.push(tdef);
						} else if (tdef.type === 'org.kevoree.NodeType') {
							$scope.nodes.push(tdef);
						} else if (tdef.type === 'org.kevoree.ChannelType') {
							$scope.channels.push(tdef);
						} else if (tdef.type === 'org.kevoree.ComponentType') {
							$scope.components.push(tdef);
						}
					});
					$scope.loading = false;
				});
			})
			.catch(function (err) {
				$timeout(function () {
					if (err.status >= 300) {
						$scope.error = err.config.method + ' ' + err.config.url + ' failed (' + err.status + ' ' + err.statusText + ')';
					} else {
						$scope.error = 'Unable to reach ' + $scope.getUrl();
					}
					$scope.loading = false;
				});
			});

		$scope.select = function (evt, tdef) {
			evt.preventDefault();

			if (!angular.isDefined(tdef.open)) {
				tdef.open = true;
			}

			var selected = Boolean(tdef.selected);
			var selection = $scope.selection.length;

			if (evt.ctrlKey) {
				if (selected) {
					// remove it
					tdef.selected = false;
				} else {
					// add it
					tdef.selected = true;
				}
			} else {
				// unselect all
				$scope.selection.length = 0;
				$scope.groups
					.concat($scope.nodes)
					.concat($scope.channels)
					.concat($scope.components)
					.forEach(function (tdef) {
						tdef.selected = false;
					});

				if (selected && (selection > 1)) {
					// unselect all but this item
					tdef.selected = true;
				} else {
					// toggle tdef
					tdef.selected = !selected;
				}
			}

			if (tdef.selected) {
				if ($scope.selection.indexOf(tdef) === -1) {
					tdef.selectedVersion = tdef.versions[tdef.versions.length - 1];
					$scope.selection.push(tdef);
					kRegistry.addDeployUnits(tdef.namespace.name, tdef.name, tdef.selectedVersion.version)
						.then(function (dus) {
							$timeout(function () {
								tdef.selectedVersion.latestDus = dus.latestDus;
								tdef.selectedVersion.releaseDus = dus.releaseDus;
							});
						});
				}
			} else {
				$scope.selection.splice($scope.selection.indexOf(tdef), 1);
			}
		};

		$scope.getTdefInModel = function (tdef) {
			var model = kEditor.getModel();
			var pkgPath = kModelHelper.pkgFqnToPath(tdef.namespace.name);
			var tdefPath = '/' + pkgPath + '/typeDefinitions[name=' + tdef.name + ',version=' + tdef.selectedVersion.version + ']';

			return model.findByPath(tdefPath);
		};

		$scope.changeVersion = function (tdef) {
			kRegistry.addDeployUnits(tdef.namespace.name, tdef.name, tdef.selectedVersion.version, tdef.selectedVersion)
				.then(function (res) {
					$scope.selection.forEach(function (t) {
						if (t.namespace.name === tdef.namespace.name
							&& t.name === tdef.name
							&& t.selectedVersion.version === tdef.selectedVersion.version) {
								t.selectedVersion.latestDus = res.latestDus;
								t.selectedVersion.releaseDus = res.releaseDus;
							}
					});
				});
			$scope.closeError();
		};

		function createModel(tdef, releases) {
			var tdefInModel = $scope.getTdefInModel(tdef);
			if (tdefInModel) {
				tdefInModel.deployUnits.array.forEach(function (du) {
					du.delete();
				});
				tdefInModel.removeAllDeployUnits();
			}

			var deeperPkg;
			var model = kFactory.createContainerRoot()
				.withGenerated_KMF_ID(0);
			kFactory.root(model);

			function processDeployUnits(dus) {
				var compare = kFactory.createModelCompare();
				dus.forEach(function (du) {
					compare.merge(model, du.model)
						.applyOn(model);
					var path = deeperPkg.path() + '/deployUnits[name=' + du.name + ',version=' + du.version + ']';
					model.select(path)
						.array.forEach(function (duInModel) {
							tdef.selectedVersion.model.addDeployUnits(duInModel);
						});
				});
			}

			var pkg;
			tdef.namespace.name.split('.')
				.forEach(function (name, index, names) {
					var newPkg = kFactory.createPackage();
					newPkg.name = name;
					if (pkg) {
						pkg.addPackages(newPkg);
					} else {
						model.addPackages(newPkg);
					}
					pkg = newPkg;
					if (index + 1 === names.length) {
						deeperPkg = pkg;
					}
				});
			deeperPkg.addTypeDefinitions(tdef.selectedVersion.model);

			if (releases) {
				processDeployUnits(tdef.selectedVersion.releaseDus);
			} else {
				processDeployUnits(tdef.selectedVersion.latestDus);
			}

			return model;
		}

		$scope.useLatest = function (tdef) {
			try {
				kEditor.merge(createModel(tdef, false));
				$scope.success = true;
			} catch (err) {
				$scope.error = err.message;
			}
		};

		$scope.mergeLatest = function (tdef) {
			try {
				var model = createModel(tdef, false);
				var compare = kFactory.createModelCompare();
				var currentModel = kEditor.getModel();
				compare.merge(currentModel, model)
					.applyOn(currentModel);
				kEditor.setModel(currentModel);
				$scope.success = true;
			} catch (err) {
				$scope.error = err.message;
			}
		};

		$scope.useReleases = function (tdef) {
			try {
				kEditor.merge(createModel(tdef, true));
				$scope.success = true;
			} catch (err) {
				$scope.error = err.message;
			}
		};

		$scope.useAllLatest = function () {
			$scope.selection.forEach(function (tdef) {
				if (!$scope.isAlreadyInModel(tdef, false)) {
					$scope.useLatest(tdef);
				}
			});
		};

		$scope.useAllReleases = function () {
			$scope.selection.forEach(function (tdef) {
				if (!$scope.isAlreadyInModel(tdef, true)) {
					$scope.useReleases(tdef);
				}
			});
		};

		$scope.isAlreadyInModel = function (tdef, releases) {
			var tdefFound = $scope.getTdefInModel(tdef);

			if (tdefFound) {
				var dus;
				if (releases) {
					dus = tdef.selectedVersion.releaseDus || [];
				} else {
					dus = tdef.selectedVersion.latestDus || [];
				}
				for (var i = 0; i < dus.length; i++) {
					var duPath = 'deployUnits[name=' + dus[i].name + ',version=' + dus[i].version + ']';
					if (tdefFound.eContainer()
						.select(duPath)
						.array.length !== 1) {
						return false;
					}
				}
			}
			return tdefFound;
		};

		$scope.areAlreadyInModel = function (releases) {
			return $scope.selection.every(function (tdef) {
				return $scope.isAlreadyInModel(tdef, releases);
			});
		};

		$scope.hasReleases = function () {
			return $scope.selection.some(function (tdef) {
				return tdef.selectedVersion.releaseDus && tdef.selectedVersion.releaseDus.length;
			});
		};

		$scope.hasLatest = function () {
			return $scope.selection.some(function (tdef) {
				return tdef.selectedVersion.latestDus && tdef.selectedVersion.latestDus.length;
			});
		};

		$scope.closeError = function () {
			$scope.error = null;
		};
	});
