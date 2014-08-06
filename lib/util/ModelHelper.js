var Kotlin = require('kevoree-kotlin');
var kevoree = require('kevoree-library').org.kevoree;
var semver = require('semver');

/**
 * 
 * @param tDef
 * @returns {'node'|'channel'|'component'|'group'|'unknown_type'}
 */
function findTypeDefinitionType(tDef) {
    if      (Kotlin.isType(tDef, kevoree.NodeType))      return 'node';
    else if (Kotlin.isType(tDef, kevoree.ChannelType))   return 'channel';
    else if (Kotlin.isType(tDef, kevoree.ComponentType)) return 'component';
    else if (Kotlin.isType(tDef, kevoree.GroupType))     return 'group';
    
    return 'unknown_type';
}

/**
 *
 * @param instance Kevoree entity instance
 * @returns {'node'|'channel'|'component'|'group'|'port'|'unknown_type'}
 */
function findInstanceType(instance) {
    if      (Kotlin.isType(instance, kevoree.ContainerNode))     return 'node';
    else if (Kotlin.isType(instance, kevoree.Channel))           return 'channel';
    else if (Kotlin.isType(instance, kevoree.ComponentInstance)) return 'component';
    else if (Kotlin.isType(instance, kevoree.Group))             return 'group';
    else if (Kotlin.isType(instance, kevoree.Port))              return 'port';
    
    return 'unknown_type';
}

/**
 * 
 * @param tDefName
 * @param model
 * @returns {string}
 */
function findLatestVersion(tDefName, model) {
    var tDefs = model.typeDefinitions.iterator();
    var version = null;
    while (tDefs.hasNext()) {
        var tDef = tDefs.next();
        if (tDef.name === tDefName) {
            if (!version) {
                version = tDef.version;
            } else {
                // if version is not semver valid, then it will return the first one found
                // otherwise, semver will tell which one is the latest =)
                if (semver.valid(tDef.version) && semver.gt(tDef.version, version)) {
                    version = tDef.version;
                }       
            }
        }
    }
    return version;
}

/**
 * 
 * @param tDefName
 * @param model
 * @returns {Array}
 */
function findTypeDefinitionVersions(tDefName, model) {
    var versions = [];
    var tDefs = model.typeDefinitions.iterator();
    while (tDefs.hasNext()) {
        var tDef = tDefs.next();
        if (tDef.name === tDefName) versions.push(tDef.version);
    }
    return versions;
}

/**
 * 
 * @param tDef
 * @param model
 * @returns {Number}
 */
function countInstances(tDef, model) {
    function counter(instances, name) {
        var count = 0;
        while (instances.hasNext()) {
            var instance = instances.next();
            if (instance.typeDefinition.name === name) count++;
        }
        return count;
    }

    var type = findTypeDefinitionType(tDef);
    switch (type) {
        case 'node':
            var nodes = model.nodes.iterator();
            return counter(nodes, tDef.name);
        
        case 'group':
            var groups = model.groups.iterator();
            return counter(groups, tDef.name);
        
        case 'channel':
            var hubs = model.hubs.iterator();
            return counter(hubs, tDef.name);
        
        case 'component':
            var count = 0;
            var nodes = model.nodes.iterator();
            while (nodes.hasNext()) {
                var node = nodes.next();
                var compz = node.components.iterator();
                count += counter(compz, tDef.name);
            }
            return count;
        
        default:
            break;
    }
}

/**
 *
 * @param model
 */
function getChannelTypes(model) {
    var chans = [],
        tdefs = model.typeDefinitions.iterator();
    while (tdefs.hasNext()) {
        var tdef = tdefs.next();
        if (Kotlin.isType(tdef, kevoree.ChannelType)) {
            chans.push(tdef);
        }
    }
    return chans;
}

exports.countInstances              = countInstances;
exports.findTypeDefinitionType      = findTypeDefinitionType;
exports.findInstanceType            = findInstanceType;
exports.findLatestVersion           = findLatestVersion;
exports.findTypeDefinitionVersions  = findTypeDefinitionVersions;
exports.getChannelTypes             = getChannelTypes;