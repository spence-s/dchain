import path from 'node:path';
import fs from 'fs-extra';
import { pathExists } from 'path-exists';

async function gitIgnore() {
  const debug = this.debug.extend('editor-config');
  const { spinner } = this;
  const editorconfigPath = path.join(this.cwd, '.editorconfig');
  const defaultEditorConfig = [
    'root = true',
    '',
    '[*]',
    'indent_style = space',
    'indent_size = 2',
    'end_of_line = lf',
    'charset = utf-8',
    'trim_trailing_whitespace = true',
    'insert_final_newline = true'
  ];

  debug('checking if .editorconfig exists in %s', this.cwd);
  if (await pathExists(editorconfigPath)) {
    spinner.warn('A custom .editorconfig has already been created.');

    // merge in our ignore
    const currentGitIgnore = [
      ...(await fs.readFile(editorconfigPath))
        // eslint-disable-next-line unicorn/no-await-expression-member
        .toString()
        .split('\n')

        .map((line) => line.trim()),
      ''
    ];

    let isChanged = false;

    // simple dedupe
    for (const ignore of defaultEditorConfig.filter(
      (line) => !line.startsWith('#')
    )) {
      if (currentGitIgnore.includes(ignore)) continue;
      currentGitIgnore.push(ignore);
      isChanged = true;
    }

    currentGitIgnore.push('');

    if (isChanged) {
      await fs.writeFile(defaultEditorConfig, currentGitIgnore.join('\n'));
      spinner.succeed('Fixed .editorconfig!');
    } else {
      spinner.warn('No .editorconfig changes needed');
    }
  } else {
    spinner.start('Creating new .editorconfig');
    await fs.writeFile(
      path.join(this.cwd, '.editorconfig'),
      defaultEditorConfig.join('\n')
    );
    spinner.succeed('.editorconfig created');
  }
}

export default gitIgnore;
