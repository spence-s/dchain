import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
import fs from 'fs-extra';
import { pathExists } from 'path-exists';
import Lassify from '../src/lassify.js';

test.beforeEach(async (t) => {
  t.context.tmpDir = await tmp.dir({
    unsafeCleanup: true,
    prefix: 'lassify-tests'
  });
  t.context.cwd = t.context.tmpDir.path;
});

test.afterEach.always(async (t) => {
  await t.context.tmpDir.cleanup();
});

test('initializes git if needed', async (t) => {
  const { cwd } = t.context;

  const pkg = {};
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));

  const lassify = new Lassify({
    cwd,
    _ncuResults: { foo: 'bar' },
    silent: true
  });

  await lassify.manageGitInit();

  t.true(await pathExists(path.join(cwd, '.git')));
});
