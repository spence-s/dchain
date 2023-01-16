import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
import fs from 'fs-extra';
import Dchain from '../dist/src/dchain.js';
import { defaultConfig } from '../dist/src/helpers/config.js';
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

test('Does not throw when ran in empty dir', async (t) => {
  const { cwd } = t.context;
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });
  await t.notThrowsAsync(dchain.initialize());
});

test('uses default config if none present', async (t) => {
  const { cwd } = t.context;
  const pkg = {};
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });
  await dchain.initialize();
  t.deepEqual(dchain.config, defaultConfig);
});

test('finds config', async (t) => {
  const { cwd } = t.context;
  await copyFixture('with-config', cwd);
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });
  await dchain.initialize();
  t.deepEqual(dchain.config, { xo: true });
  t.is(dchain.configPath, path.join(cwd, '.lassrc'));
});

test('finds custom config', async (t) => {
  const { cwd } = t.context;
  await copyFixture('custom-config', cwd);
  const config = path.join(cwd, '.testrc');
  const dchain = new Dchain({
    cwd,
    config,
    _ncuResults: {},
    silent: true
  });
  await dchain.initialize();
  t.deepEqual(dchain.config, { xo: true });
  t.is(dchain.configPath, config);
});

test('caches correct managed dependencies', async (t) => {
  const { cwd } = t.context;
  const pkg = {};
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });

  await dchain.initialize();
  t.deepEqual(
    dchain.managedDependencies.sort(),
    Object.keys(_ncuResults).sort()
  );
  t.deepEqual(dchain.originalDependencies, {});
});

test('caches correct original dependencies', async (t) => {
  const { cwd } = t.context;
  const pkg = {
    devDependencies: {
      husky: '0.0.1'
    },
    dependencies: {
      xo: '0.0.1'
    }
  };
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true
  });
  await dchain.initialize();
  t.deepEqual(
    dchain.managedDependencies.sort(),
    Object.keys(_ncuResults).sort()
  );
  t.deepEqual(dchain.originalDependencies, {
    ...pkg.devDependencies,
    ...pkg.dependencies
  });
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
