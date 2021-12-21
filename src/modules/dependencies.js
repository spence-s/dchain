import prompts from 'prompts';
import isSANB from 'is-string-and-not-blank';
// import semver from 'semver';
import { isEmpty, pick } from '../helpers/_.js';

async function manageDependencies() {
  const debug = this.debug.extend('dependencies');
  const { spinner, packageJson } = this;

  spinner.start('Managing lassify dependencies');
  const { devDependencies: devDeps = {}, dependencies: deps = {} } =
    packageJson;

  let newPackageJsonDevDeps = {};
  let newPackageJsonDeps = {};

  const questions = Object.entries(this.ncuResults)
    .map(([dep, semverValue]) => {
      if (typeof this.originalDependencies[dep] === 'undefined')
        return {
          type: 'confirm',
          name: dep,
          message: `  Install ${dep}?`
        };

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
  const shouldUpdatePackage = !isEmpty(promptAnswers);

  // only download something if we answered yes on prompts
  const shouldDownload = !isEmpty(promptAnswers);

  if (Object.keys(promptAnswers).length > 0) {
    const answersEntries = Object.entries(promptAnswers);

    newPackageJsonDevDeps = answersEntries.reduce(
      (acc, [key, shouldUpdate]) => {
        if (isSANB(deps[key])) return acc;
        acc[key] = shouldUpdate ? this.ncuResults[key] : devDeps[key];
        return acc;
      },
      {}
    );

    newPackageJsonDeps = answersEntries.reduce((acc, [key, shouldUpdate]) => {
      if (isSANB(deps[key]))
        acc[key] = shouldUpdate ? this.ncuResults[key] : deps?.[key];

      return acc;
    }, {});
  }

  if (shouldUpdatePackage) {
    spinner.start('Updating your package.json to lassify standards!');
    const newPackageJson = {
      ...packageJson,
      devDependencies: {
        ...packageJson.devDependencies,
        ...newPackageJsonDevDeps
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
