'use strict';

var fs = require('fs');

module.exports = {
  endsWith: endsWith,
  parseVersion: parseVersion,
  isLintFixed: isLintFixed
};

function endsWith(str, suffix) {
  return str.indexOf('/', str.length - suffix.length) !== -1;
}

// return the version number from `package.json` file
function parseVersion() {
  var pkgJson = fs.readFileSync('package.json', 'utf8');
  var result = JSON.parse(pkgJson);
  if (result.version === null) {
    throw new Error('package.json is malformed. No version is defined');
  }
  return result.version;
}

function isLintFixed(file) {
	// Has ESLint fixed the file contents?
  return file.eslint !== null && file.eslint.fixed;
}
