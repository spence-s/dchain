// import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
// import fs from 'fs-extra';
// import { defaultConfig } from '../src/helpers/config.js';
import Lassify from '../src/lassify.js';
import { copyFixture } from './helpers/copy-fixture.js';
import { _ncuResults } from './helpers/ncu-results.js';

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

test('detects yarn package manager', async (t) => {
  const { cwd } = t.context;
  await copyFixture('yarn', cwd);
  const lassify = new Lassify({
    cwd,
    _ncuResults,
    silent: true
  });
  await lassify.initialize();
  t.is(lassify.pm, 'yarn');
});
