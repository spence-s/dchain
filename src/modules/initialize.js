import path from 'node:path';
import { readPackageUp } from 'read-pkg-up';
import { loadJsonFile } from 'load-json-file';
import { cosmiconfig } from 'cosmiconfig';
import ncu from 'npm-check-updates';
import { pathExists } from 'path-exists';
import * as _ from '../helpers/_.js';

/**
 * Finds or creates the package.json for the current working dir.
 * @returns this
 */
async function initialize() {
  const debug = this.debug.extend('init');
  this.spinner.start('Initializing lassify!');

  // find config or use default
  if (typeof this.config === 'undefined')
    if (this.configPath) {
      const config = await loadJsonFile(this.configPath);
      this.config = Object.freeze(config);
      debug('found passed config');
    } else {
      debug('searching for config');
      const { config = this.config, filepath: configPath } =
        (await cosmiconfig('lass').search(this.cwd)) ||
        (() => {
          debug('using default config');
          return { config: this.defaultConfig };
        })();
      this.configPath = configPath;
      this.config = Object.freeze(config);
      debug('config resolved');
    }

  // all the dependencies we should take care of
  for (const conf of Object.keys(this.config))
    this.managedDependencies = [
      ...(this.managedDependencies || []),
      ...(Array.isArray(this.configMap[conf])
        ? this.configMap[conf]
        : [this.configMap[conf]])
    ].filter(Boolean);

  if (this.managedDependencies.length === 0)
    throw new Error(
      'Configuration must have at least 1 dependency for lassify to manage'
    );

  debug('cached config');

  // find the package.json - must be in this dir
  const { path: pkgPath, packageJson } = (await readPackageUp({
    cwd: this.cwd,
    normalize: false,
    stopAt: this.cwd
  })) || { path: path.join(this.cwd, 'package.json'), packageJson: {} };

  debug('package %O', packageJson);

  let shouldSavePackage = false;
  if (_.isEmpty(packageJson)) shouldSavePackage = true;

  // cache the original package.json as well as some extra meta stuff we can use later
  this.packageJson = { ...packageJson };
  this.originalPackageJson = Object.freeze(packageJson);
  this.pkgPath = pkgPath;

  debug('found and cached packageJson for %s', pkgPath);

  debug('retreiving ncu results');

  this.ncuResults =
    this.ncuResults ??
    (await ncu.run({
      loglevel: 'silent',
      packageData: {
        devDependencies: Object.fromEntries(
          this.managedDependencies.map((dep) => [dep, '^0.0.0'])
        )
      }
    }));

  debug('retreived and cached ncuResults %O', this.ncuResults);

  // cache the original dependencies, and make sure we can't change them again
  this.originalDependencies = Object.freeze(
    _.pick(
      {
        ...packageJson.devDependencies,
        ...packageJson.dependencies
      },
      this.managedDependencies
    )
  );

  debug('original dependencies %O', this.originalDependencies);

  // initialize prompt answers
  this.promptAnswers = {};

  // const figure out package manager
  this.pm = (await pathExists(path.join(this.cwd, 'yarn.lock')))
    ? 'yarn'
    : (await pathExists(path.join(this.cwd, 'package-lock.json')))
    ? 'npm'
    : '';

  this.spinner.succeed('Lassify initialized successfully!');

  if (shouldSavePackage) {
    debug('saving package.json because we are in a directory without one.');
    await this.writePackageJson();
  }

  return this;
}

export default initialize;
