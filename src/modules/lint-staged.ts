import path from 'node:path';
import { cosmiconfig } from 'cosmiconfig';
import { pathExists } from 'path-exists';
import type Dchain from '../dchain.js';
import template from '../templates/lint-staged.js';

async function manageLintStaged(this: Dchain) {
  if (!this.config.lintStaged || !this.config.husky) return this;

  const { spinner, spawn } = this;

  // const debug = this.debug.extend('lint-staged');

  const shouldRemoveAdd =
    this.originalDependencies['lint-staged'] &&
    this.originalDependencies['lint-staged'] < 10;

  const husky = path.join(this.cwd, 'node_modules', '.bin', 'husky');

  const hasHusky = await pathExists(husky);

  // https://github.com/okonet/lint-staged/blob/master/lib/index.js#L27
  let { filepath: lsrcPath, config: lsConfig } =
    (await cosmiconfig('lint-staged', {
      searchPlaces: [
        'package.json',
        '.lintstagedrc',
        '.lintstagedrc.json',
        '.lintstagedrc.yaml',
        '.lintstagedrc.yml',
        '.lintstagedrc.js',
        '.lintstagedrc.cjs',
        'lint-staged.config.js',
        'lint-staged.config.cjs'
      ],
      stopDir: this.cwd
    }).search(this.cwd)) ?? {};

  if (lsrcPath && (await pathExists(lsrcPath))) {
    spinner.warn('A lint staged config already exists');
    if (shouldRemoveAdd) {
      spinner.start('Migrating lint-staged config for you!');
      const newLsConf = Object.fromEntries(
        Object.entries(lsConfig).map(([fileType, lsConf]) => {
          if (Array.isArray(lsConf))
            lsConf = lsConf.filter((c) => c !== 'git add');

          return [fileType, lsConf];
        })
      );

      const { packageJson, pkgPath } = this;

      if (lsrcPath.includes('package.json')) {
        lsrcPath = lsrcPath.replace('package.json', '.lintstagedrc');
        await this.writeConf(newLsConf, lsrcPath);
        delete packageJson['lint-staged'];
        await this.writePackageJson();
        spinner.succeed('Fixed and moved lint staged config to .lintstagedrc');
      } else {
        await this.writeConf(newLsConf, lsrcPath);
        spinner.succeed('Fixed lint staged config');
      }
    }
  } else {
    lsrcPath = path.join(this.cwd, '.lintstagedrc.js');
    const lsrc = template;

    await this.writeConf(lsrc, lsrcPath);
    spinner.succeed('lint-staged installed successfully!');
  }

  // install commitlint husky hook
  if (await pathExists(path.join(this.cwd, '.husky', 'pre-commit'))) {
    spinner.warn('There is already a pre-commit hook installed for husky');
  } else if (hasHusky) {
    await spawn(
      husky,
      [
        'add',
        '.husky/pre-commit',
        `${this.pm === 'npm' ? 'npx' : 'yarn'} lint-staged`
      ],
      {
        stdio: 'ignore'
      }
    );
    spinner.succeed('lint-staged git hook installed');
  } else {
    spinner.warn('husky is not installed so no commit hook was installed');
  }
}

export default manageLintStaged;
