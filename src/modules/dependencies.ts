import prompts from 'prompts';

import type { Answers, PromptObject } from 'prompts';
import type { PackageJson } from 'type-fest';

import { isEmpty, pick } from '../helpers/_.js';
import type Lassify from '../lassify.js';

async function manageDependencies(this: Lassify) {
  const debug = this.debug.extend('dependencies');
  const { spinner, packageJson } = this;

  spinner.start('Managing lassify dependencies');
  const { devDependencies: devDeps = {}, dependencies: deps = {} } =
    packageJson;

  let newPackageJsonDevDeps: PackageJson.Dependency = {};
  let newPackageJsonDeps: PackageJson.Dependency = {};

  const questions = Object.entries(this.ncuResults)
    // eslint-disable-next-line @typescript-eslint/ban-types
    .map(([dep, semverValue]): PromptObject | null => {
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
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `  Update ${dep} from ${this.originalDependencies[dep]} -> ${semverValue}?`
        };
      }

      return null;
    })

    .filter((value): value is PromptObject => value !== null);

  debug('questions %O', questions);

  spinner.stop();
  debug('questions answered');

  if (this.yes) prompts.inject(questions.map(() => true));

  // cache this just in case
  this.promptAnswers = await prompts(questions);

  // filter out false answers
  const promptAnswers: Answers<string> = pick(
    this.promptAnswers,
    (key: string, value: unknown): value is true => Boolean(value)
  );

  debug('prompt answers %O', promptAnswers);

  // update package if we need to reformat semver or if we need to update deps
  const shouldUpdatePackage = !isEmpty(promptAnswers);

  // only download something if we answered yes on prompts
  const shouldDownload = !isEmpty(promptAnswers);

  if (Object.keys(promptAnswers).length > 0) {
    const answersEntries = Object.entries(promptAnswers);

    newPackageJsonDevDeps = answersEntries.reduce<PackageJson.Dependency>(
      (acc, [key, shouldUpdate]) => {
        if (typeof deps[key] === 'string') return acc;
        acc[key] = shouldUpdate ? this.ncuResults[key] : devDeps[key];
        return acc;
      },
      {}
    );

    newPackageJsonDeps = answersEntries.reduce<PackageJson.Dependency>(
      (acc, [key, shouldUpdate]) => {
        if (typeof deps[key] === 'string')
          acc[key] = shouldUpdate ? this.ncuResults[key] : deps?.[key];

        return acc;
      },
      {}
    );
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
    this.packageJson = newPackageJson as PackageJson;
    await this.writePackageJson();
    spinner.succeed('Package updated!');
  }

  if (shouldDownload) {
    spinner.succeed('Installing new and/or updated dependencies');
    await this.spawn(this.pm, ['install']);
    spinner.stop();

    spinner.succeed('Dependencies installed!');
  } else spinner.succeed('All dependencies are installed and up to date!');
}

export default manageDependencies;
