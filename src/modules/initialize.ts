import path from 'node:path';
import { readPackageUp } from 'read-pkg-up';
import { loadJsonFile } from 'load-json-file';
import { cosmiconfig } from 'cosmiconfig';
import ncu from 'npm-check-updates';
import { pathExists } from 'path-exists';

import type { PackageJson } from 'type-fest';

import * as _ from '../helpers/_.js';

import type { Dchain, Config } from '../dchain.js';

/**
 * Finds or creates the package.json for the current working dir.
 * @returns this
 */
async function initialize(this: Dchain) {
  const debug = this.debug.extend('init');
  this.spinner.start('Initializing dchain!');

  // find config or use default
  if (_.isEmpty(this.config)) {
    if (this.configPath) {
      const config = await loadJsonFile<Config>(this.configPath);
      this.config = Object.freeze(config);
      debug('found passed config');
    } else {
      debug('searching for config');
      const { config = this.config, filepath: configPath } =
        (await cosmiconfig('lass').search(this.cwd)) ??
        (() => {
          debug('using default config');
          return { config: this.defaultConfig, filepath: undefined };
        })();
      this.configPath = configPath;
      this.config = Object.freeze(config);
      debug('config resolved');
    }
  }

  // all the dependencies we should take care of
  for (const conf of Object.keys(this.config)) {
    // eslint-disable-next-line unicorn/prefer-spread
    this.managedDependencies = this.managedDependencies.concat(
      ...(Array.isArray(this.configMap[conf])
        ? this.configMap[conf]
        : [this.configMap[conf]])
    );

    this.managedDependencies = this.managedDependencies.filter(Boolean);
  }

  if (this.managedDependencies?.length === 0)
    throw new Error(
      'Configuration must have at least 1 dependency for dchain to manage'
    );

  debug('%O', this.managedDependencies);

  debug('cached config');

  // find the package.json - must be in this dir
  const { path: pkgPath, packageJson } = ((await readPackageUp({
    cwd: this.cwd,
    normalize: false
  })) ?? { path: path.join(this.cwd, 'package.json'), packageJson: {} }) as {
    path: string;
    packageJson: PackageJson;
  };

  debug('package %O', packageJson);

  let shouldSavePackage = false;
  if (_.isEmpty(packageJson)) shouldSavePackage = true;

  // cache the original package.json as well as some extra meta stuff we can use later
  this.packageJson = { ...packageJson };
  this.originalPackageJson = Object.freeze(packageJson);
  this.pkgPath = pkgPath;

  debug('found and cached packageJson for %s', pkgPath);

  debug('retreiving ncu results');

  this.ncuResults = _.isEmpty(this.ncuResults)
    ? ((await ncu.run({
        loglevel: 'silent',
        packageData: {
          devDependencies: Object.fromEntries(
            this.managedDependencies.map((dep) => [dep, '^0.0.0'])
          )
        }
      })) as PackageJson.Dependency)
    : {};

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

  this.spinner.succeed('Dchain initialized successfully!');

  if (shouldSavePackage) {
    debug('saving package.json because we are in a directory without one.');
    await this.writePackageJson();
  }

  return this;
}

export default initialize;
