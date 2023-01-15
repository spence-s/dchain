import path from 'node:path';
import { pathExists } from 'path-exists';
import type Dchain from '../dchain.js';

async function gitInit(this: Dchain) {
  const debug = this.debug.extend('git-init');
  const { spinner, spawn } = this;
  debug('checking if git has been initialized');
  if (await pathExists(path.join(this.cwd, '.git'))) {
    spinner.warn('Git has been previously initialized.');
  } else {
    spinner.info('Initializing git');
    await spawn('git', ['init', '--quiet']);
    spinner.succeed('Git initialized');
  }
}

export default gitInit;
