import path from 'node:path';
import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs-extra';
import { pathExists } from 'path-exists';
import { pick } from '../helpers/_.js';
import { writeConf } from '../helpers/write-config-file.js';

async function manageLintStaged() {
  const { spinner, packageJson, spawn, configuredDeps } = this;

  const { devDependencies: devDeps, dependencies: deps } = packageJson;
  const dependencies = { ...devDeps, ...deps };
  const managedDeps = Object.keys(dependencies).filter((dep) =>
    configuredDeps.includes(dep)
  );
  const installedManagedDeps = pick(dependencies, managedDeps);

  const shouldRemoveAdd =
    installedManagedDeps['lint-staged'] &&
    installedManagedDeps['lint-staged'] < 10;

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
    }).search(this.cwd)) || {};

  if (await pathExists(lsrcPath)) {
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

      const { packageJson, pkgPath } = this.packageJson;

      if (lsrcPath.includes('package.json')) {
        lsrcPath = lsrcPath.replace('package.json', '.lintstagedrc');
        await writeConf(newLsConf, lsrcPath, packageJson);
        delete packageJson['lint-staged'];
        await fs.writeFile(pkgPath, packageJson);
        spinner.succeed('Fixed and moved lint staged config to .lintstagedrc');
      } else {
        await writeConf(newLsConf, lsrcPath, packageJson);
        spinner.succeed('Fixed lint staged config');
      }
    }
  } else {
    lsrcPath = path.join(this.cwd, '.lintstagedrc');
    const lsrc = [
      '{',
      '  "*.md,!test/**/*.md": "prettier --check",',
      '  "package.json": "fixpack --dryrun",',
      '  "*.js": "xo --fix"',
      '}'
    ];

    await fs.writeFile(lsrcPath, lsrc.join('\n'));
    spinner.succeed('lint-staged installed successfully!');
  }

  // install commitlint husky hook
  if (await pathExists(path.join(this.cwd, '.husky', 'pre-commit'))) {
    spinner.warn('There is already a pre-commit hook installed for husky');
  } else if (hasHusky) {
    const pm = 'yarn'; // npx --no-install
    await spawn(husky, ['add', '.husky/pre-commit', `${pm} lint-staged`], {
      stdio: 'ignore'
    });
    spinner.succeed('lint-staged git hook installed');
  } else {
    spinner.warn('husky is not installed so no commit hook was installed');
  }
}

export default manageLintStaged;
