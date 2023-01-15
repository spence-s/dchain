import path from 'node:path';
import { pathExists } from 'path-exists';
import { cosmiconfig } from 'cosmiconfig';
import semver from 'semver';
import type { PackageJson } from 'type-fest';
import { writeConf } from '../helpers/write-config-file.js';
import type Dchain from '../dchain.js';

const hooks = [
  'applypatch-msg',
  'pre-applypatch',
  'post-applypatch',
  'pre-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-rebase',
  'post-checkout',
  'post-merge',
  'pre-receive',
  'update',
  'post-receive',
  'post-update',
  'pre-auto-gc',
  'post-rewrite',
  'pre-push'
];

async function manageHusky(this: Dchain) {
  const debug = this.debug.extend('husky');
  const { spawn, spinner } = this;

  const huskyExec = path.join(this.cwd, 'node_modules', '.bin', 'husky');

  const huskyFolder = path.join(this.cwd, '.husky');

  if (!(await pathExists(huskyExec))) {
    spinner.fail(
      `We couldn't find husky in your node_modules. Please re-install and insure node_modules exists in your directory. If you are using yarn berry or pnpm we currently only support a local node_modules folder`
    );
    return;
  }

  const husky = (command: string[]) =>
    spawn(huskyExec, command, { stdio: 'ignore' });

  await husky(['install']);

  if (await pathExists(huskyFolder)) spinner.warn('.husky already exists');
  else spinner.succeed('husky installed');

  debug('checking for husky upgrade path if needed.');

  let huskyUpgradePath;
  if (
    typeof this.originalDependencies?.husky === 'string' &&
    semver.subset(this.originalDependencies?.husky ?? '', '0')
  )
    huskyUpgradePath = '0';
  else if (
    typeof this.originalDependencies?.husky === 'string' &&
    semver.subset(this.originalDependencies?.husky ?? '', '1 - 4')
  )
    huskyUpgradePath = '1';

  if (huskyUpgradePath) {
    spinner.warn(
      `Husky needs to be migrated to the current husky api, don't worry, your hooks will be preserved.`
    );

    let scriptsToMigrate: PackageJson.Scripts = {};

    // for upgrade path 0 we need to take the git hooks from the scripts
    if (huskyUpgradePath === '0') {
      const fHooks = new Set(...hooks.map((h) => h.replace(/-/g, '')));
      const newPackageScripts = Object.fromEntries(
        Object.entries(this.packageJson.scripts ?? {}).filter(
          ([hook, script]) => {
            if (fHooks.has(hook)) {
              scriptsToMigrate[hook] = script;
              return false;
            }

            return true;
          }
        )
      );

      debug('new package scripts %O', newPackageScripts);

      debug('scripts to migrate %O', scriptsToMigrate);
    }

    // for upgrade path 1 we need take the hooks from husky.hooks
    // we also need to use cosmicconfig here to find the hooks
    if (huskyUpgradePath === '1') {
      let { config, filepath } =
        (await cosmiconfig('husky').search(this.cwd)) ?? {};

      debug('found config %O at %s', config, filepath);

      if (config.hooks) config = config.hooks;

      scriptsToMigrate = config;

      for (const [hook, command = ''] of Object.entries(scriptsToMigrate)) {
        if (!hooks.includes(hook)) {
          spinner.warn(`${hook} is not a valid git hook`);
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        if (await pathExists(path.join(huskyFolder, hook))) {
          spinner.warn(
            `${hook} is already installed properly, no need to migrate`
          );
          continue;
        }

        spinner.start(`Migrating "${hook} ${command}"`);

        // eslint-disable-next-line no-await-in-loop
        await husky([
          'add',
          `.husky/${hook}`,
          `${this.pm === 'npm' ? 'npx' : this.pm} ${command
            .replace('HUSKY_GIT_PARAMS', '$1')
            .replace('-E', '--edit')}`
        ]);

        spinner.succeed();
      }

      spinner.succeed(`husky hooks migrated`);

      if (filepath?.includes('package.json')) {
        delete this.packageJson.husky;
        await this.writePackageJson();
      }
    }
  } else if (this.config.commitlint) {
    debug('install commitlint husky hook');
    // install commitlint husky hook
    if (await pathExists(path.join(this.cwd, '.husky', 'commit-msg'))) {
      spinner.warn('There is already a commit-msg hook installed for husky');
    } else {
      await husky([
        'add',
        '.husky/commit-msg',
        `${this.pm === 'npm' ? 'npx' : this.pm} commitlint --edit $1`
      ]);
      spinner.succeed('commitlint git hook installed');
    }

    const commitlintTemplate = {
      extends: ['@commitlint/config-conventional']
    };

    const commitlintConfigPath = path.join(this.cwd, '.commitlintrc.json');

    if (await pathExists(commitlintConfigPath)) {
      this.spinner.warn('commitlint config already exists');
    } else {
      await writeConf(
        commitlintTemplate,
        commitlintConfigPath,
        this.packageJson
      );
      this.spinner.succeed('added default commitlint config');
    }
  }
}

export default manageHusky;
