import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
import fs from 'fs-extra';
import sinon from 'sinon';
import Lassify from '../src/lassify.js';
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

test('installs configured deps that are not present', async (t) => {
  const { cwd } = t.context;
  const pkg = {};
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const lassify = new Lassify({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await lassify.initialize();
  lassify.spawn = sinon.fake();
  lassify.writePackageJson = sinon.fake();
  await lassify.manageDeps();
  t.true(lassify.spawn.calledOnce);
  t.true(lassify.writePackageJson.calledOnce);
  t.deepEqual(lassify.packageJson.devDependencies, _ncuResults);
  t.deepEqual(lassify.packageJson.dependencies, {});
});

test('installs configured deps that are not present and updates ones that are present', async (t) => {
  const { cwd } = t.context;
  const pkg = {
    devDependencies: {
      xo: '0.0.1'
    }
  };
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const lassify = new Lassify({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await lassify.initialize();
  lassify.spawn = sinon.fake();
  lassify.writePackageJson = sinon.fake();
  await lassify.manageDeps();
  t.true(lassify.spawn.calledOnce);
  t.true(lassify.writePackageJson.calledOnce);
  t.deepEqual(lassify.packageJson.devDependencies, _ncuResults);
  t.deepEqual(lassify.packageJson.dependencies, {});
});

test('installs configured deps that are not present and updates ones that are present in dependencies', async (t) => {
  const { cwd } = t.context;
  const pkg = {
    dependencies: {
      xo: '0.0.1'
    }
  };
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const lassify = new Lassify({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await lassify.initialize();
  lassify.spawn = sinon.fake();
  lassify.writePackageJson = sinon.fake();
  await lassify.manageDeps();
  t.true(lassify.spawn.calledOnce);
  t.true(lassify.writePackageJson.calledOnce);
  t.deepEqual(lassify.packageJson.dependencies, { xo: _ncuResults.xo });
  const { xo, ...expectedDevDeps } = _ncuResults;
  t.deepEqual(lassify.packageJson.devDependencies, expectedDevDeps);
});
