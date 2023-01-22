import path, { sep } from 'node:path';
import prompts from 'prompts';
import validateNpm from 'validate-npm-package-name';
import { pathExists } from 'path-exists';
import * as _ from '../helpers/_.js';
import { writeConf } from '../helpers/write-config-file.js';

import type Dchain from '../dchain.js';

async function pkg(this: Dchain) {
  const debug = this.debug.extend('pkg');
  const { spinner } = this;

  debug('%O', this.packageJson);

  if (_.isEmpty(this.packageJson))
    spinner.warn('Initializing new package.json');

  if (
    !this.packageJson?.name ||
    !validateNpm(this.packageJson.name).validForNewPackages
  ) {
    debug('asking for name');
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      initial: this.cwd.split(sep)[this.cwd.split(sep).length - 1],
      message: `  What is the name of you of your new project??`,
      validate: (name) =>
        validateNpm(name).validForNewPackages
          ? true
          : 'not a valid npm package name!'
    });

    debug('response: %s', name);

    this.packageJson.name = name;

    await this.writePackageJson();
  }

  if (!this.packageJson?.description) {
    debug('asking for description');
    const { description } = await prompts({
      type: 'text',
      name: 'description',
      initial: 'my awesome project!',
      message: `  Describe your new project`,
      validate: (value) =>
        /"/.test(value) ? 'description cannot contain double quotes' : true
    });

    debug('response: %s', description);

    this.packageJson.description = description;

    await this.writePackageJson();
  }

  if (!this.pm) {
    debug('asking for package manager');
    const choices = [{ title: 'npm' }, { title: 'yarn' }, { title: 'pnpm' }];
    const { pm } = await prompts({
      name: 'pm',
      message: '  Choose a package manager',
      choices,
      type: 'select',
      initial: 0
    });

    debug('package manager %s', choices[pm]);

    this.pm = choices[pm]?.title as typeof this.pm;
  }

  if (!(await pathExists(path.join(this.cwd, '.npmpackagejsonlintrc')))) {
    await writeConf(
      JSON.stringify({
        extends: 'npm-package-json-lint-config-default'
      }),
      '.npmpackagejsonlintrc',
      this.packageJson,
      'json'
    );
  }
}

export default pkg;
