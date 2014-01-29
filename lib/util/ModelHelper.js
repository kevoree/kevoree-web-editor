var Kotlin = require('kevoree-kotlin');
var kevoree = require('kevoree-library').org.kevoree;
var semver = require('semver');

/**
 *
 * @param tDef Kevoree TypeDefinition instance
 * @param options {node: function () {}, channel: function () {}, group: function () {}, comp: function () {}}
 */
function findTypeDefinitionType(tDef, options) {
    if      (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl))      return options.node();
    else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl))   return options.channel();
    else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) return options.component();
    else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl))     return options.group();
}

/**
 *
 * @param instance Kevoree entity instance
 * @param options {node: function () {}, channel: function () {}, group: function () {}, comp: function () {}}
 */
function findInstanceType(instance, options) {
    if      (Kotlin.isType(tDef, kevoree.impl.ContainerNodeImpl))     return options.node();
    else if (Kotlin.isType(tDef, kevoree.impl.ChannelImpl))           return options.channel();
    else if (Kotlin.isType(tDef, kevoree.impl.ComponentInstanceImpl)) return options.component();
    else if (Kotlin.isType(tDef, kevoree.impl.GroupImpl))             return options.group();
}

function getTypeDefinitionString(tDef) {
    if      (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl))      return 'node';
    else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl))   return 'channel';
    else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) return 'component';
    else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl))     return 'group';
}

function findLatestVersion(tDefName, model) {
    var tDefs = model.typeDefinitions.iterator();
    var version = '0.0.0';
    while (tDefs.hasNext()) {
        var tDef = tDefs.next();
        if (tDef.name === tDefName) {
            if (semver.gt(tDef.version, version)) version = tDef.version;
        }
    }
    return version;
}

function countInstances(tDef, model) {
    function counter(instances, name, version) {
        var count = 0;
        while (instances.hasNext()) {
            var instance = instances.next();
            if (instance.typeDefinition.name === name && instance.typeDefinition.version === version) count++;
        }
        return count;
    }

    return findTypeDefinitionType(tDef, {
        node: function () {
            var nodes = model.nodes.iterator();
            return counter(nodes, tDef.name, tDef.version);
        },
        group: function () {
            var groups = model.groups.iterator();
            return counter(groups, tDef.name, tDef.version);
        },
        channel: function () {
            var hubs = model.hubs.iterator();
            return counter(hubs, tDef.name, tDef.version);
        },
        component: function () {
            var count = 0;
            var nodes = model.nodes.iterator();
            while (nodes.hasNext()) {
                var node = nodes.next();
                var compz = node.components.iterator();
                count += counter(compz, tDef.name, tDef.version);
            }
            return count;
        }
    });
}

exports.countInstances          = countInstances;
exports.findTypeDefinitionType  = findTypeDefinitionType;
exports.findInstanceType        = findInstanceType;
exports.getTypeDefinitionString = getTypeDefinitionString;
exports.findLatestVersion       = findLatestVersion;