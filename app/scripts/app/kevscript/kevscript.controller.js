'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:KevScriptCtrl
 * @description
 * # KevScriptCtrl
 * Controller of the editorApp kevscript editor page
 */
angular.module('editorApp')
	.controller('KevScriptCtrl', function ($rootScope, $scope, $modal, $timeout, $state, hotkeys, kEditor, kScript, saveFile, storage, Notification) {
		var editor = null;

		function saveToFile(event) {
			if (event && event.preventDefault) {
				event.preventDefault();
			}
			$modal
				.open({
					templateUrl: 'scripts/components/util/filename.modal.html',
					size: 'sm',
					scope: $scope,
					controller: function ($scope, $modalInstance) {
						$scope.title = 'Save Kevscript';
						$scope.body = 'Would you like to save your current KevScript to a file?';
						$scope.filename = 'script' + (Math.floor(Math.random() * (1000 - 100)) + 100);

						$scope.save = function () {
							function endsWith(str, suffix) {
								return str.indexOf(suffix, str.length - suffix.length) !== -1;
							}
							var suffix = '.kevs';
							if (endsWith($scope.filename, suffix)) {
								$scope.filename = $scope.filename.substr(0, $scope.filename.length - '.kevs'.length);
							}
							saveFile.save($scope.kevscript, $scope.filename, suffix, 'kevscript');
							$modalInstance.close();
						};
					}
				})
				.result.finally(function () {
					if (editor) {
						editor.focus();
					}
				});
		}

		function openFromFile(event) {
			if (event && event.preventDefault) {
				event.preventDefault();
			}
			angular.element('input#kevscript-upload').click();
		}

		$scope.kevscript = '';
		$scope.processing = false;
		$scope.message = null;
		$scope.ctxVars = {};
		$scope.error = null;
		$scope.lintWarnings = [];
		$scope.linting = false;
		$scope.typing = false;
		$scope.editorState = 'idle';
		$scope.editorOptions = {
			mode: 'kevscript',
			theme: 'kevscript',
			lineWrapping: true,
			lineNumbers: true,
			styleActiveLine: true,
			extraKeys: {
				'Shift-Enter': function () {
					$scope.merge();
				},
				'Ctrl-Space': function (cm) {
					cm.showHint({ hint: CodeMirror.hint.kevscript, completeSingle: false });
				},
				'Ctrl-S': saveToFile,
				'Ctrl-O': openFromFile
			},
			gutters: ['CodeMirror-lint-markers'],
			lint: {
				getAnnotations: CodeMirror.lint.kevscript($scope.ctxVars),
				async: true
			}
		};

		$scope.dndLoad = function (filename, data) {
			if (filename.endsWith('.kevs')) {
				$scope.kevscript = data;
			} else {
				$scope.kevscript = '';
				$rootScope.dndLoad(filename, data);
			}
		};

		$scope.editorLoaded = function (_editor) {
			editor = _editor;
			CodeMirror.hint.kevscript.async = true;
			editor.on('beforeChange', function () {
				$timeout(function () {
					$scope.editorState = 'typing';
					$scope.error = null;
					$scope.lintWarnings = [];
				});
			});
			editor.on('lintStart', function () {
				$timeout(function () {
					$scope.editorState = 'linting';
				});
			});
			editor.on('lintDone', function (error, lintErrors, model) {
				$timeout(function () {
					$scope.editorState = 'idle';
					$scope.model = model;
					$scope.error = error || lintErrors.filter(function (err) {
						return err.severity === 'error';
					})[0];
					$scope.lintWarnings = lintErrors
						.filter(function (error) {
							return error.severity === 'warning';
						});
					$scope.linting = false;
				});
			});
			editor.focus();
			CodeMirror.signal(editor, 'change', editor);
		};

		$scope.uploadKevscript = function () {
			var kevscriptUpload = angular.element('#kevscript-upload');
			kevscriptUpload.on('change', function (event) {
				var reader = new FileReader();
				reader.onloadend = function () {
					$scope.kevscript = editor.setValue(reader.result);
				};
				reader.readAsBinaryString(event.target.files[0]);
			});
			kevscriptUpload.trigger('click');
		};

		$scope.closeMessage = function () {
			$scope.message = null;
		};

		$scope.isMergeable = function () {
			return $scope.editorState === 'idle' &&
				!$scope.processing &&
				!$scope.error &&
				$scope.kevscript.trim().length > 0;
		};

		$scope.clearCtxVars = function () {
			Object.keys($scope.ctxVars).forEach(function (key) {
				delete $scope.ctxVars[key];
			});
			CodeMirror.signal(editor, 'change', editor);
		};

		$scope.addCtxVar = function (ctxVar) {
			if (ctxVar.key && ctxVar.value) {
				$scope.ctxVars[ctxVar.key] = ctxVar.value;
				ctxVar.key = '';
				ctxVar.value = '';
				CodeMirror.signal(editor, 'change', editor);
			}
		};

		$scope.onFileLoaded = function (filename, data) {
			$scope.kevscript = data;
		};

		$scope.removeCtxVar = function (key) {
			delete $scope.ctxVars[key];
			CodeMirror.signal(editor, 'change', editor);
		};

		$scope.merge = function () {
			if (!$scope.processing) {
				$scope.processing = true;
				$timeout(function () {
					kEditor.setModel($scope.model, function (err) {
						$scope.processing = false;
						if (err) {
							$scope.error = err;
						} else {
							editor.setValue('');
							Notification.success({
								title: 'KevScript',
								message: 'Successfully merged'
							});
						}
					});
				});
			}
		};

		$scope.model2kevs = function () {
			try {
				var modelStr = kScript.parseModel(kEditor.getModel());
				editor.setValue(modelStr);
			} catch (err) {
				console.warn('[kevscript.controller.model2kevs()] Error creating Kevscript from model'); // eslint-disable-line
				console.error(err.stack); // eslint-disable-line
				Notification.error({
					title: 'KevScript parser',
					message: 'Unable to convert current model to KevScript',
					delay: 5000
				});
			}
		};

		$scope.save = saveToFile;
		$scope.open = openFromFile;

		hotkeys.bindTo($scope)
			.add({
				combo: 'ctrl+o',
				description: 'Open a KevScript from a file',
				callback: $scope.open
			});

		hotkeys.bindTo($scope)
			.add({
				combo: 'ctrl+s',
				description: 'Save current KevScript to a file',
				callback: $scope.save
			});

		$scope.toggleShortcutHelp = function () {
			hotkeys.toggleCheatSheet();
		};
	});
