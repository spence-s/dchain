#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import init from './init.js';
import lassify from './lassify.js';

const cli = meow(
  `
  Run lassify at the root of any project to install and manage your devDependencies.

	Usage:
	  $ lassify [options]

	Options
    --init  Creates a .lassrc in your project based on a series of prompts
    --cwd   Optional directory to run the cli from. Defaults to process.cwd().

	Examples
	  $ lassify
    $ lassify --init
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
    if (cli.flags.init) {
      await init();
      return process.exit(0);
    }

    await lassify(cli.flags);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
