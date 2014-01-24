var Kotlin = require('kevoree-kotlin');
var kevoree = require('kevoree-library').org.kevoree;

/**
 * Created by leiko on 23/01/14.
 */
module.exports = {
    /**
     *
     * @param tDef Kevoree TypeDefinition instance
     * @param options {node: function () {}, channel: function () {}, group: function () {}, comp: function () {}}
     */
    findTypeDefinitionType: function (tDef, options) {
        if      (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl))      return options.node();
        else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl))   return options.channel();
        else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) return options.comp();
        else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl))     return options.group();
    },

    /**
     *
     * @param instance Kevoree entity instance
     * @param options {node: function () {}, channel: function () {}, group: function () {}, comp: function () {}}
     */
    findInstanceType: function (instance, options) {
        if      (Kotlin.isType(tDef, kevoree.impl.ContainerNodeImpl))     return options.node();
        else if (Kotlin.isType(tDef, kevoree.impl.ChannelImpl))           return options.channel();
        else if (Kotlin.isType(tDef, kevoree.impl.ComponentInstanceImpl)) return options.comp();
        else if (Kotlin.isType(tDef, kevoree.impl.GroupImpl))             return options.group();
    },

    getTypeDefinitionString: function (tDef) {
        if      (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl))      return 'node';
        else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl))   return 'channel';
        else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) return 'component';
        else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl))     return 'group';
    }
}