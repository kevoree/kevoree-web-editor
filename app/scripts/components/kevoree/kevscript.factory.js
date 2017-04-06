'use strict';

angular.module('editorApp')
	.factory('kScript', function () {
		var logger = new KevoreeCommons.Logger('KevScript');
		return new KevoreeKevscript(logger, {
			resolver: KevoreeKevscript.Resolvers.tagResolverFactory(logger,
				KevoreeKevscript.Resolvers.modelResolverFactory(logger,
					KevoreeKevscript.Resolvers.lsResolverFactory(logger,
						KevoreeKevscript.Resolvers.registryResolverFactory(logger))))
		});
	});
