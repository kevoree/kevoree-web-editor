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
 * @param fqn Fully qualified name (package name(s) + typeDef name => org.kevoree.library.javascript.JavascriptNode)
 * @param model
 * @returns {string}
 */
function findLatestVersion(fqn, model) {
    // init version to null
    var version = null;

    var splittedFQN = fqn.split('.');
    if (splittedFQN.length <= 1) {
        throw new Error('ModelHelper#findLatestVersion(...): TypeDefinition FQN "'+fqn+'" is malformed');
    } else {
        var tdef = splittedFQN.pop(); // remove (and cache) last item
        var kevPath = '';
        splittedFQN.forEach(function (item) {
            if (kevPath.length > 0) { kevPath += '/'; }
            kevPath += 'packages['+item+']';
        });
        kevPath += '/typeDefinitions[name='+tdef+']';

        var tdefs = model.select(kevPath);
        if (tdefs.length < 1) {
            throw new Error('ModelHelper#findLatestVersion(...): unable to find TypeDefinition "'+fqn+'"');
        } else {
            tdefs.forEach(function (tDef) {
                if (tDef.name === fqn) {
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
            });
        }
    }

    return version;
}

/**
 * 
 * @param {Object}  tdef
 * @param {Object}  model
 * @returns {Array}
 */
function findTypeDefinitionVersions(tdef, model) {
    var fqn = getFQN(tdef);
    var tdefs = findTypeDefinitionsByFQN(fqn, model).iterator();
    var versions = [];
    while (tdefs.hasNext()) {
        versions.push(tdefs.next().version);
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
            if (instance.typeDefinition.name === name) {
                count++;
            }
        }
        return count;
    }

    var type = findTypeDefinitionType(tDef);
    var nodes;
    switch (type) {
        case 'node':
            nodes = model.nodes.iterator();
            return counter(nodes, tDef.name);
        
        case 'group':
            var groups = model.groups.iterator();
            return counter(groups, tDef.name);
        
        case 'channel':
            var hubs = model.hubs.iterator();
            return counter(hubs, tDef.name);
        
        case 'component':
            var count = 0;
            nodes = model.nodes.iterator();
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
    var chans = [];

    function walk(pkg) {
        if (pkg.packages.size() > 0) {
            pkg.packages.array.forEach(walk);
        }

        pkg.typeDefinitions.array.forEach(function (tdef) {
            if (Kotlin.isType(tdef, kevoree.ChannelType)) {
                chans.push(tdef);
            }
        });
    }

    model.packages.array.forEach(walk);
    return chans;
}

/**
 * Creates a fully qualified name (eg. org.kevoree.library.js.JavascriptNode)
 * @param {Object} elem  Must be a Package, TypeDefinition or DeployUnit
 * @returns {String} Fully qualified name
 */
function getFQN(elem) {
    var fqn = elem.name;
    function walk(pkg) {
        if (pkg.eContainer()) {
            fqn = pkg.name + '.' + fqn;
            walk(pkg.eContainer());
        }
    }

    walk(elem.eContainer());

    return fqn;
}

/**
 * Returns the Package object represented by this fqn
 * @param fqn
 * @param model
 * @returns {Object}
 */
function findPackageByFQN(fqn, model) {
    fqn = fqn.split('.');
    var path = 'packages[';
    for (var i=0; i < fqn.length; i++) {
        if (i === fqn.length -1) {
            path += fqn[i] + ']';
        } else {
            path += fqn[i] + ']/packages[';
        }
    }

    return model.findByPath(path);
}

/**
 * Call 'fn' for each Package that has TypeDefinition inside
 * @param {Object}   parent
 * @param {Function} fn
 */
function walkPackageTree(parent, fn) {
    var processContent = function() {
        if (parent.typeDefinitions && parent.typeDefinitions.size() > 0) {
            fn(parent);
        }
    };

    if (parent.packages && parent.packages.size() > 0) {
        // has child package(s)
        processContent();
        var packages = parent.packages.iterator();
        while (packages.hasNext()) {
            walkPackageTree(packages.next(), fn);
        }

    } else {
        processContent();
    }
}

/**
 * Returns all the TypeDefinition that matches the given FQN
 * @param fqn
 * @param model
 * @returns {Kotlin.List}
 */
function findTypeDefinitionsByFQN(fqn, model) {
    var version;
    fqn = fqn.split('/');
    if (fqn.length === 2) {
        // version specified
        version = fqn[1];
    }
    fqn = fqn[0].split('.');
    var type = fqn.pop();
    var path = 'packages[';
    for (var i=0; i < fqn.length; i++) {
        if (i === fqn.length -1) {
            path += fqn[i] + ']';
        } else {
            path += fqn[i] + ']/packages[';
        }
    }

    if (version) {
        path += '/typeDefinitions[name='+type+',version='+version+']';
    } else {
        path += '/typeDefinitions[name='+type+']';
    }

    return model.select(path);
}

exports.countInstances              = countInstances;
exports.findTypeDefinitionType      = findTypeDefinitionType;
exports.findInstanceType            = findInstanceType;
//exports.findLatestVersion           = findLatestVersion;
exports.findTypeDefinitionVersions  = findTypeDefinitionVersions;
exports.getChannelTypes             = getChannelTypes;
exports.getFQN                      = getFQN;
exports.findPackageByFQN            = findPackageByFQN;
exports.walkPackageTree             = walkPackageTree;
exports.findTypeDefinitionsByFQN    = findTypeDefinitionsByFQN;