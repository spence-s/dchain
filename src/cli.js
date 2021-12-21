#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import Lassify from './lassify.js';

const cli = meow(
  `
    Run lassify at the root of any project to install and manage your devDependencies.

    Usage:
      $ lassify [options]

    Options
      --cwd      Optional directory to run the cli from. Defaults to process.cwd().
      --silent   Suppress all output from cli
      --yes, -y  Answer yes to all upgrade prompts

    Examples
      $ lassify
      $ lassify --cwd '../other/directory'
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    booleanDefault: undefined,
    flags: {
      cwd: {
        type: 'string'
      },
      yes: {
        type: 'boolean',
        default: false,
        alias: 'y'
      }
    }
  }
);

(async () => {
  try {
    await new Lassify(cli.flags).run();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
