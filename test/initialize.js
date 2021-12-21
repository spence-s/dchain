import path from 'node:path';
import test from 'ava';
import fs from 'fs-extra';
import tmp from 'tmp-promise';
import { defaultConfig } from '../src/helpers/managed-deps.js';
import Lassify from '../src/lassify.js';
import { copyFixture } from './helpers/copy-fixture.js';

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

test('throws when no package.json present in cwd', async (t) => {
  const { cwd } = t.context;
  const lassify = new Lassify({
    cwd,
    _ncuResults: { foo: 'bar' },
    silent: true
  });
  await t.throwsAsync(lassify.initialize());
});

test('uses default config if none present', async (t) => {
  const { cwd } = t.context;

  await fs.writeFile(path.join(cwd, 'package.json'), '{}');

  const lassify = new Lassify({
    cwd,
    _ncuResults: {},
    silent: true
  });
  await lassify.initialize();
  t.deepEqual(lassify.config, defaultConfig);
});

test('finds config', async (t) => {
  const { cwd } = t.context;
  await copyFixture('with-config', cwd);
  const lassify = new Lassify({
    cwd,
    _ncuResults: {},
    silent: true
  });
  await lassify.initialize();
  t.deepEqual(lassify.config, { test: 'file' });
  t.is(lassify.configPath, path.join(cwd, '.lassrc'));
});

test('finds custom config', async (t) => {
  const { cwd } = t.context;
  await copyFixture('custom-config', cwd);
  const config = path.join(cwd, '.testrc');
  const lassify = new Lassify({
    cwd,
    config,
    _ncuResults: {},
    silent: true
  });
  await lassify.initialize();
  t.deepEqual(lassify.config, { custom: 'file' });
  t.is(lassify.configPath, config);
});
