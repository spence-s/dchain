import ncu from 'npm-check-updates';
import prompts from 'prompts';
import isSANB from 'is-string-and-not-blank';
// import semver from 'semver';
import { isEmpty, pick } from '../helpers/_.js';

async function manageDependencies() {
  const debug = this.debug.extend('dependencies');
  const { spinner, packageJson, configuredDeps } = this;

  spinner.start('Managing lassify dependencies');
  const { devDependencies: devDeps, dependencies: deps } = packageJson;
  let newPackageJsonDevDeps = {};
  let newPackageJsonDeps = {};

  let shouldUpdatePackage;
  let shouldDownload;

  if (!isEmpty(this.originalDependencies)) {
    // force all deps to '0' for ncu to analyze - which
    // will force ncu to return properly versioned dependencies for the updates
    const devDependencies = Object.fromEntries(
      Object.entries(this.originalDependencies).map((dep) => {
        dep[1] = '^0.0.0';
        return dep;
      })
    );

    debug('analyzing devDependencies with ncu %O', devDependencies);
    const upgradeable = await ncu.run({
      loglevel: 'silent',
      packageData: { devDependencies }
    });

    debug('ncu results %O', upgradeable);

    debug('determining deps to upgrade');

    if (!isEmpty(upgradeable)) {
      const questions = Object.entries(upgradeable)
        .map(([dep, semverValue]) => {
          if (this.originalDependencies[dep] !== semverValue) {
            return {
              type: 'confirm',
              name: dep,
              message: `  Update ${dep} from ${this.originalDependencies[dep]} -> ${semverValue}?`
            };
          }

          return null;
        })
        .filter(Boolean);

      spinner.stop();

      if (this.yes) prompts.inject(questions.map(() => true));

      // cache this just in case
      this.promptAnswers = await prompts(questions);

      // filter out false answers
      const promptAnswers = pick(this.promptAnswers, (key, value) =>
        Boolean(value)
      );

      debug('prompt answers %O', promptAnswers);

      // update package if we need to reformat semver or if we need to update deps
      shouldUpdatePackage = !isEmpty(promptAnswers);

      // only download something if we answered yes on prompts
      shouldDownload = !isEmpty(promptAnswers);

      if (Object.keys(promptAnswers).length > 0) {
        const answersEntries = Object.entries(promptAnswers);

        newPackageJsonDevDeps = answersEntries.reduce(
          (acc, [key, shouldUpdate]) => {
            if (isSANB(devDeps[key]))
              acc[key] = shouldUpdate ? upgradeable[key] : devDeps[key];

            return acc;
          },
          {}
        );

        newPackageJsonDeps = answersEntries.reduce(
          (acc, [key, shouldUpdate]) => {
            if (isSANB(deps?.[key]))
              acc[key] = shouldUpdate ? upgradeable?.[key] : deps?.[key];

            return acc;
          },
          {}
        );
      }
    }
  }

  const newConfigDeps = configuredDeps.reduce((acc, dep) => {
    if (
      !newPackageJsonDeps[dep] &&
      !newPackageJsonDevDeps[dep] &&
      !this.originalDependencies[dep]
    )
      acc[dep] = 'latest';
    return acc;
  }, {});

  if (shouldUpdatePackage) {
    spinner.start('Updating your package.json to lassify standards!');
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
    this.packageJson = newPackageJson;
    await this.writePackageJson();
    spinner.succeed('Package updated!');
  }

  if (shouldDownload) {
    spinner.succeed(
      'Installing new and/or updated dependencies selected dependencies'
    );
    await this.spawn('yarn', ['install']);
    spinner.stop();

    spinner.succeed('Dependencies installed!');
  } else spinner.succeed('All dependencies are installed and up to date!');
}

export default manageDependencies;
