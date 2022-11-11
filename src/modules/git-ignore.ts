import path from 'node:path';
import fs from 'node:fs/promises';
import { pathExists } from 'path-exists';
import type Lassify from '../lassify.js';

async function gitIgnore(this: Lassify) {
  const debug = this.debug.extend('git-ignore');
  const { spinner } = this;
  const gitIgnorePath = path.join(this.cwd, '.gitignore');
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
  debug('checking if .gitignore exists in %s', this.cwd);
  if (await pathExists(gitIgnorePath)) {
    spinner.warn('A custom .gitignore has already been created.');

    // merge in our ignore
    const currentGitIgnore = [
      ...(await fs.readFile(gitIgnorePath))
        // eslint-disable-next-line unicorn/no-await-expression-member
        .toString()
        .split('\n')

        .map((line) => line.trim()),
      ''
    ];

    let isChanged = false;

    // simple dedupe
    for (const ignore of defaultGitIgnore.filter(
      (line) => !line.startsWith('#')
    )) {
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
    spinner.start('Creating new .gitignore');
    await fs.writeFile(
      path.join(this.cwd, '.gitignore'),
      defaultGitIgnore.join('\n')
    );
    spinner.succeed('.gitignore created');
  }
}

export default gitIgnore;
