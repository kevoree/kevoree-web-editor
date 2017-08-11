const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');
const config = require('./config');
const pkg = require('../package.json');

/**
 * Parses package.json 'browserModules' in order to create an array of assets
 * @return {array} array of assets to inject
 */
function npmFiles() {
  return Object.keys(pkg.browserModules).reduce((files, name) => {
    const modulePath = join(config.npm, name);
    const targets = getFiles(modulePath);
    return files.concat(targets);
  }, []);
}

const isFile = (source) => lstatSync(source).isFile();
const getFiles = (source) =>
  readdirSync(source).map((name) =>
    join(source, name)).filter(isFile);

module.exports = npmFiles;
