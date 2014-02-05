var Kotlin = require('kevoree-kotlin');
var kevoree = require('kevoree-library').org.kevoree;
var semver = require('semver');

/**
 * 
 * @param tDef
 * @returns {'node'|'channel'|'component'|'group'}
 */
function findTypeDefinitionType(tDef) {
    if      (Kotlin.isType(tDef, kevoree.impl.NodeTypeImpl))      return 'node';
    else if (Kotlin.isType(tDef, kevoree.impl.ChannelTypeImpl))   return 'channel';
    else if (Kotlin.isType(tDef, kevoree.impl.ComponentTypeImpl)) return 'component';
    else if (Kotlin.isType(tDef, kevoree.impl.GroupTypeImpl))     return 'group';
    
    return null;                                                          
}

/**
 *
 * @param instance Kevoree entity instance
 * @returns {'node'|'channel'|'component'|'group'}
 */
function findInstanceType(instance) {
    if      (Kotlin.isType(instance, kevoree.impl.ContainerNodeImpl))     return 'node';
    else if (Kotlin.isType(instance, kevoree.impl.ChannelImpl))           return 'channel';
    else if (Kotlin.isType(instance, kevoree.impl.ComponentInstanceImpl)) return 'component';
    else if (Kotlin.isType(instance, kevoree.impl.GroupImpl))             return 'group';
    
    return null;
}

/**
 * 
 * @param tDefName
 * @param model
 * @returns {string}
 */
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

/**
 * 
 * @param tDef
 * @param model
 * @returns {Number}
 */
function countInstances(tDef, model) {
    function counter(instances, name, version) {
        var count = 0;
        while (instances.hasNext()) {
            var instance = instances.next();
            if (instance.typeDefinition.name === name && instance.typeDefinition.version === version) count++;
        }
        return count;
    }

    var type = findTypeDefinitionType(tDef);
    switch (type) {
        case 'node':
            var nodes = model.nodes.iterator();
            return counter(nodes, tDef.name, tDef.version);
        
        case 'group':
            var groups = model.groups.iterator();
            return counter(groups, tDef.name, tDef.version);
        
        case 'channel':
            var hubs = model.hubs.iterator();
            return counter(hubs, tDef.name, tDef.version);
        
        case 'component':
            var count = 0;
            var nodes = model.nodes.iterator();
            while (nodes.hasNext()) {
                var node = nodes.next();
                var compz = node.components.iterator();
                count += counter(compz, tDef.name, tDef.version);
            }
            return count;
        
        default:
            break;
    }
}

exports.countInstances          = countInstances;
exports.findTypeDefinitionType  = findTypeDefinitionType;
exports.findInstanceType        = findInstanceType;
exports.findLatestVersion       = findLatestVersion;