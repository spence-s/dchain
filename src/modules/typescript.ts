import path from 'node:path';
import { pathExists } from 'path-exists';
import type Dchain from '../dchain.js';
import { writeConf } from '../helpers/write-config-file.js';

async function ts(this: Dchain) {
  const debug = this.debug.extend('git-init');
  const { spinner, spawn } = this;
  debug('checking if typescript config exists');
  if (await pathExists(path.join(this.cwd, '.git'))) {
    spinner.warn('typescript config has been previously created.');
  } else {
    spinner.info('Creating typescript config');
    await writeConf(
      {
        compilerOptions: {
          module: 'Node16',
          outDir: 'dist',
          target: 'ES2022',
          strict: true,
          rootDir: '.',
          skipLibCheck: true
        },
        exclude: ['node_modules', 'dist'],
        include: ['src/**/*']
      },
      path.join(this.cwd, 'tsconfig.json'),
      this.packageJson
    );
  }
}

export default ts;