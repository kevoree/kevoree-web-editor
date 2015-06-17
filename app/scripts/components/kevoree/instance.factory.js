'use strict';

angular.module('editorApp')
    .factory('kInstance', function (kFactory, kModelHelper) {
        return {
            /**
             * Init instance dictionaries with default values and stuff
             * @param instance
             */
            initDictionaries: function (instance) {
                // create dictionary values if none set
                instance.dictionary = instance.dictionary || kFactory.createDictionary();
                if (instance.typeDefinition.dictionaryType) {
                    instance.typeDefinition.dictionaryType.attributes
                        .array.forEach(function (attr) {
                            var val;
                            if (!kModelHelper.isTruish(attr.fragmentDependant)) {
                                // attribute is not fragment dependant
                                val = instance.dictionary.findValuesByID(attr.name);
                                if (!val) {
                                    val = kFactory.createValue();
                                    val.name = attr.name;
                                    val.value = attr.defaultValue;
                                    instance.dictionary.addValues(val);
                                }
                            } else {
                                // attribute is fragment dependant
                                // create fragment dictionaries if needed
                                switch (kModelHelper.getTypeDefinitionType(instance.typeDefinition)) {
                                    case 'channel':
                                        instance.bindings.array.forEach(function (binding) {
                                            if (binding.port) {
                                                if (!instance.findFragmentDictionaryByID(binding.port.eContainer().eContainer().name)) {
                                                    var fragDic = kFactory.createFragmentDictionary();
                                                    fragDic.name = binding.port.eContainer().eContainer().name;
                                                    instance.addFragmentDictionary(fragDic);
                                                }
                                            }
                                        });
                                        break;

                                    case 'group':
                                        instance.subNodes.array.forEach(function (node) {
                                            if (!instance.findFragmentDictionaryByID(node.name)) {
                                                var fragDic = kFactory.createFragmentDictionary();
                                                fragDic.name = node.name;
                                                instance.addFragmentDictionary(fragDic);
                                            }
                                        });
                                        break;
                                }
                                // add default value to fragment dictionaries that does not already have them
                                instance.fragmentDictionary.array.forEach(function (fragDic) {
                                    val = fragDic.findValuesByID(attr.name);
                                    if (!val) {
                                        val = kFactory.createValue();
                                        val.name = attr.name;
                                        val.value = attr.defaultValue;
                                        fragDic.addValues(val);
                                    }
                                });
                            }
                        });
                }
            },

            /**
             * Init instance fragment dictionaries (normal dictionary will not be init)
             * @param instance
             */
            initFragmentDictionaries: function (instance) {
                if (instance.typeDefinition.dictionaryType) {
                    instance.typeDefinition.dictionaryType.attributes
                        .array.forEach(function (attr) {
                            var val;
                            if (kModelHelper.isTruish(attr.fragmentDependant)) {
                                // attribute is fragment dependant
                                // create fragment dictionaries if needed
                                switch (kModelHelper.getTypeDefinitionType(instance.typeDefinition)) {
                                    case 'channel':
                                        instance.bindings.array.forEach(function (binding) {
                                            if (binding.port) {
                                                if (!instance.findFragmentDictionaryByID(binding.port.eContainer().eContainer().name)) {
                                                    var fragDic = kFactory.createFragmentDictionary();
                                                    fragDic.name = binding.port.eContainer().eContainer().name;
                                                    instance.addFragmentDictionary(fragDic);
                                                }
                                            }
                                        });
                                        break;

                                    case 'group':
                                        instance.subNodes.array.forEach(function (node) {
                                            if (!instance.findFragmentDictionaryByID(node.name)) {
                                                var fragDic = kFactory.createFragmentDictionary();
                                                fragDic.name = node.name;
                                                instance.addFragmentDictionary(fragDic);
                                            }
                                        });
                                        break;
                                }
                                // add default value to fragment dictionaries that does not already have them
                                instance.fragmentDictionary.array.forEach(function (fragDic) {
                                    val = fragDic.findValuesByID(attr.name);
                                    if (!val) {
                                        val = kFactory.createValue();
                                        val.name = attr.name;
                                        val.value = attr.defaultValue;
                                        fragDic.addValues(val);
                                    }
                                });
                            }
                        });
                }
            }
        };
    });