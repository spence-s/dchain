#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import lassify from './lassify.js';

const cli = meow(
  `
  Run lassify at the root of any project to install and manage your devDependencies.

	Usage:
	  $ lassify [options]

	Options
    --cwd   Optional directory to run the cli from. Defaults to process.cwd().

	Examples
	  $ lassify
    $ lassify --cwd '../other/directory'
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    booleanDefault: undefined,
    flags: {
      new: {
        type: 'string'
      },
      init: {
        type: 'boolean'
      },
      template: {
        type: 'string',
        alias: 't'
      }
    }
  }
);

(async () => {
  try {
    await lassify(cli.flags);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
