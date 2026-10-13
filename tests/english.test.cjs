const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const {build, translate} = require('../scripts/build-english.cjs');
build(true);
for (const name of ['core', 'worker', 'bridge', 'ui']) {
  const filename = path.join(__dirname, name + '.test.cjs');
  let source = translate(fs.readFileSync(filename, 'utf8'));
  source = source.replaceAll("'../lib'", "'../lib/en'").replaceAll("'lib'", "'lib/en'").replace(/\.\.\/lib\/(?!en)/g, '../lib/en/');
  const test = new Module(filename, module);
  test.filename = filename;
  test.paths = Module._nodeModulePaths(__dirname);
  test._compile(source, filename);
}
console.log('English generated build and all localized regression suites passed.');
