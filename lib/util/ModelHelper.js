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
    if (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl)) {
      if (typeof options.node === 'function') {
        options.node();
      }
    } else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl)) {
      if (typeof options.channel === 'function') {
        options.channel();
      }
    } else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) {
      if (typeof options.comp === 'function') {
        options.comp();
      }
    } else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl)) {
      if (typeof options.group === 'function') {
        options.group();
      }
    }
  },

  /**
   *
   * @param instance Kevoree entity instance
   * @param options {node: function () {}, channel: function () {}, group: function () {}, comp: function () {}}
   */
  findInstanceType: function (instance, options) {
    if (Kotlin.isType(instance, kevoree.impl.ContainerNodeImpl)) {
      if (typeof options.node === 'function') {
        options.node();
      }
    } else if (Kotlin.isType(instance, kevoree.impl.ChannelImpl)) {
      if (typeof options.channel === 'function') {
        options.channel();
      }
    } else if (Kotlin.isType(instance, kevoree.impl.ComponentInstanceImpl)) {
      if (typeof options.comp === 'function') {
        options.comp();
      }
    } else if (Kotlin.isType(instance, kevoree.impl.GroupImpl)) {
      if (typeof options.group === 'function') {
        options.group();
      }
    }
  }
}