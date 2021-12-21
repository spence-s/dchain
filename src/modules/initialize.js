import path from 'node:path';
import { readPackageUp } from 'read-pkg-up';
import { loadJsonFile } from 'load-json-file';
import { cosmiconfig } from 'cosmiconfig';
import ncu from 'npm-check-updates';
import { defaultConfig } from '../helpers/managed-deps.js';
import * as _ from '../helpers/_.js';

async function init() {
  const debug = this.debug.extend('init');
  this.spinner.start('Initializing lassify!');

  // find config or use default
  if (this.configPath) {
    const config = await loadJsonFile(this.configPath);
    this.config = Object.freeze(config);
  } else {
    const { config = this.config, filepath: configPath } = (await cosmiconfig(
      'lass'
    ).search(this.cwd)) || {
      config: defaultConfig
    };
    this.configPath = configPath;
    this.config = Object.freeze(config);
  }

  debug('found and cached config');

  // find the package.json - must be in this dir
  const { path: pkgPath, packageJson } = await readPackageUp({
    cwd: this.cwd,
    normalize: false
  });

  if (path.dirname(pkgPath) !== this.cwd)
    throw new Error('Run lassify in a directory with a package.json');

  // cache the original package.json as well as some extra meta stuff we can use later
  this.originalPackageJson = Object.freeze(packageJson);
  this.packageJson = packageJson;
  this.pkgPath = pkgPath;

  debug('found and cached packageJson for %s', pkgPath);

  const dependencies = {
    ...packageJson.devDependencies,
    ...packageJson.dependencies
  };

  debug('retreiving ncu results');

  this.ncuResults =
    this.ncuResults ??
    (await ncu.run({
      loglevel: 'silent',
      packageData: {
        devDependencies: Object.fromEntries(
          Object.keys(this.config).map((dep) => [dep, '^0.0.0'])
        )
      }
    }));

  debug('retreived and cached ncuResults %O', this.ncuResults);

  // cache the original dependencies, and make sure we can't change them again
  this.originalDependencies = Object.freeze(
    _.pick(dependencies, Object.keys(this.config))
  );

  debug('original dependencies %O', this.originalDependencies);

  // initialize prompt answers
  this.promptAnswers = {};

  // const figure out package manager
  this.pm = 'yarn';

  this.spinner.succeed('Lassify initialized successfully!');

  return this;
}

export default init;
