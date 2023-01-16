// import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
// import fs from 'fs-extra';
// import { defaultConfig } from '../dist/src/helpers/config.js';
import Dchain from '../dist/src/dchain.js';
import { copyFixture } from './helpers/copy-fixture.js';
import { _ncuResults } from './helpers/ncu-results.js';

test.beforeEach(async (t) => {
  t.context.tmpDir = await tmp.dir({
    unsafeCleanup: true,
    prefix: 'dchain-tests'
  });
  t.context.cwd = t.context.tmpDir.path;
});

test.afterEach.always(async (t) => {
  await t.context.tmpDir.cleanup();
});

test('detects yarn package manager', async (t) => {
  const { cwd } = t.context;
  await copyFixture('yarn', cwd);
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });
  await dchain.initialize();
  t.is(dchain.pm, 'yarn');
});
