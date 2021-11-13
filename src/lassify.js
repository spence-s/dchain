import path from 'node:path';
import process from 'node:process';
import ora from 'ora';
import { cosmiconfig } from 'cosmiconfig';
import { readPackageUp } from 'read-pkg-up';
import ncu from 'npm-check-updates';
import prompts from 'prompts';
import fs from 'fs-extra';
import isSANB from 'is-string-and-not-blank';
import { pathExists } from 'path-exists';
import { isEmpty, pick, isObject, createSpawn } from './util.js';
import { defaultConfig } from './managed-deps.js';

// import chalk from 'chalk';
// const __dirname = dirname(import.meta.url);

export default async function lassify({ cwd: _cwd }) {
  const cwd = _cwd || process.cwd();

  const spawn = createSpawn({ cwd });

  const spinner = ora();

  spinner.start('Reading package.json');
  const { path: pkgPath, packageJson } = await readPackageUp({
    cwd,
    normalize: false
  });
  spinner.succeed('Found package.json');

  if (cwd !== path.dirname(pkgPath)) {
    spinner.fail('No package.json found in your current directory!');
    throw new Error(
      `We couldn't find a package.json in your current directory.`
    );
  }

  spinner.start('Reading config');
  // TODO: check actions against config
  const { config } = (await cosmiconfig('lass').search()) || {
    config: defaultConfig
  };
  spinner.succeed('Found config');

  const configDeps = [];
  if (config.git.husky) configDeps.push('husky');
  if (config.git['lint-staged']) configDeps.push('lint-staged');
  if (config.git.commitlint)
    configDeps.push('@commitlint/cli', '@commitlint/config-conventional');
  if (config.js.xo) configDeps.push('xo');
  if (config.package) configDeps.push('fixpack');
  if (config.test.coverage) configDeps.push('codecov', 'nyc');
  if (config.test.ava) configDeps.push('ava');

  const { devDependencies: devDeps, dependencies: deps } = packageJson;
  const dependencies = { ...devDeps, ...deps };
  const managedDeps = Object.keys(dependencies).filter((dep) =>
    configDeps.includes(dep)
  );
  const installedManagedDeps = pick(dependencies, managedDeps);

  let newPackageJsonDevDeps = {};
  let newPackageJsonDeps = {};

  if (!isEmpty(installedManagedDeps)) {
    spinner.info('Checking for dependency updates');

    const upgradeable = await ncu.run({
      loglevel: 'silent',
      packageData: { devDependencies: installedManagedDeps }
    });

    if (!isEmpty(upgradeable)) {
      spinner.info('Updates needed');

      const questions = Object.entries(upgradeable).map(([key, value]) => ({
        type: 'confirm',
        name: key,
        message: `  Update ${key} from ${installedManagedDeps[key]} -> ${value}?`
      }));

      const answers = await prompts(questions);

      spinner.start('Updating your package.json');

      const answersEntries = Object.entries(answers);

      newPackageJsonDevDeps = answersEntries.reduce(
        (acc, [key, shouldUpdate]) => {
          if (isSANB(devDeps[key]))
            acc[key] = shouldUpdate ? upgradeable[key] : devDeps[key];

          return acc;
        },
        {}
      );

      newPackageJsonDeps = answersEntries.reduce((acc, [key, shouldUpdate]) => {
        if (isSANB(deps[key]))
          acc[key] = shouldUpdate ? upgradeable[key] : deps[key];

        return acc;
      }, {});
    }
  }

  const newConfigDeps = configDeps.reduce((acc, dep) => {
    if (
      !newPackageJsonDeps[dep] &&
      !newPackageJsonDevDeps[dep] &&
      !installedManagedDeps[dep]
    )
      acc[dep] = 'latest';
    return acc;
  }, {});

  const shouldUpdate =
    !isEmpty(newPackageJsonDeps) ||
    !isEmpty(newPackageJsonDevDeps) ||
    !isEmpty(newConfigDeps);

  if (shouldUpdate) {
    const newPackageJson = {
      ...packageJson,
      devDependencies: {
        ...packageJson.devDependencies,
        ...newPackageJsonDevDeps,
        ...newConfigDeps
      },
      dependencies: {
        ...packageJson.dependencies,
        ...newPackageJsonDeps
      }
    };

    // clean errors from pkg up
    delete newPackageJson._id;
    for (const [key, value] of Object.entries(newPackageJson)) {
      if (isSANB(value) && value.includes('ERROR')) delete newPackageJson[key];

      if (isObject(value))
        for (const [innerKey, innerValue] of Object.entries(value)) {
          if (isSANB(value) && innerValue.includes('ERROR'))
            delete newPackageJson[key][innerKey];
        }
    }

    await fs.writeFile(pkgPath, JSON.stringify(newPackageJson, null, 2));

    spinner.succeed('Package updated!');
    spinner.succeed('Installing new and/or updated dependencies');
    spinner.stop();

    await spawn('yarn', ['install']);

    spinner.succeed('Dependencies installed!');
  } else spinner.succeed('All dependencies are installed and up to date!');

  // after we've checked and updated all the dependencies we
  // then go through all the managed dependencies and configure them in the workspace

  spinner.start('Checking configurations');

  // git
  if (isObject(config.git)) {
    // git init
    if (config.git.init)
      if (await pathExists(path.join(cwd, '.git'))) {
        spinner.warn('Git has been previously initialized.');
      } else {
        spinner.info('Initializing git');
        await spawn('git', ['init', '--quiet']);
        spinner.succeed('Git initialized');
      }

    // git ignore
    if (config.git.ignore) {
      const gitIgnorePath = path.join(cwd, '.gitignore');
      const defaultGitIgnore = [
        '#       OS        #',
        '###################',
        '.DS_Store',
        '.idea',
        'Thumbs.db',
        'tmp/',
        'temp/',
        '',
        '#     Node.js     #',
        '###################',
        'node_modules',
        '',
        '#       NYC       #',
        '###################',
        'coverage',
        '*.lcov',
        '.nyc_output',
        '',
        '#      Files      #',
        '###################',
        '*.log'
      ];
      if (await pathExists(gitIgnorePath)) {
        spinner.warn('A custom .gitignore has already been created.');

        // merge in our ignore
        const currentGitIgnore = await [
          ...(
            await fs.readFile(gitIgnorePath)
          )
            .toString()
            .split('\n')
            .map((line) => line.trim()),
          ''
        ];

        let isChanged = false;

        // simple dedupe
        for (const ignore of defaultGitIgnore) {
          if (currentGitIgnore.includes(ignore)) continue;
          currentGitIgnore.push(ignore);
          isChanged = true;
        }

        currentGitIgnore.push('');

        if (isChanged) {
          await fs.writeFile(gitIgnorePath, currentGitIgnore.join('\n'));
          spinner.succeed('Fixed .gitignore!');
        } else {
          spinner.warn('No .gitignore changes needed');
        }
      } else {
        await fs.writeFile(
          path.join(cwd, '.gitignore'),
          defaultGitIgnore.join('\n')
        );
      }
    }

    // husky
    if (config.git.husky) {
      const husky = path.join(cwd, 'node_modules', '.bin', 'husky');
      if (await pathExists(husky)) {
        await spawn(husky, ['install']);
        spinner.succeed('husky installed');
        // commitlint
        if (config.git.commitlint) {
          // install commitlint husky hook
          if (await pathExists(path.join(cwd, '.husky', 'commit-msg'))) {
            spinner.warn(
              'There is already a commit-msg hook installed for husky'
            );
          } else {
            const pm = 'yarn'; // npx --no-install
            await spawn(husky, [
              'add',
              '.husky/commit-msg',
              `${pm} commitlint --edit $1`
            ]);
            spinner.succeed('commitlint git hook installed');
          }
        }
      } else
        spinner.fail(
          `We couldn't find husky in your node_modules. Please re-install and insure node_modules exists in your directory. If you are using yarn berry or pnpm we currently only support a local node_modules folder`
        );
    }
  }

  // lint-staged
  if (config.git['lint-staged']) {
    const husky = path.join(cwd, 'node_modules', '.bin', 'husky');
    const lsrcPath = path.join(cwd, '.lintstagedrc.js');
    if (await pathExists(lsrcPath)) {
      spinner.warn('.lintstagedrc.js already exists');
    } else {
      const lsrc = [
        'module.exports = {',
        '  "*.md,!test/snapshots/**/*.md,!test/**/snapshots/**/*.md,!locales/README.md": [',
        // eslint-disable-next-line no-template-curly-in-string
        '    filenames => filenames.map(filename => `remark ${filename} -qfo`)',
        '  ],',
        "  'package.json': 'fixpack',",
        "  '*.js': 'xo --fix'",
        '};'
      ];

      await fs.writeFile(lsrcPath, lsrc.join('\n'));
    }

    // install commitlint husky hook
    if (await pathExists(path.join(cwd, '.husky', 'pre-commit'))) {
      spinner.warn('There is already a commit-msg hook installed for husky');
    } else {
      const pm = 'yarn'; // npx --no-install
      await spawn(husky, ['add', '.husky/pre-commit', `${pm} lint-staged`]);
      spinner.succeed('commitlint git hook installed');
    }
  }

  // remark

  // prettier
}
