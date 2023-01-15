import path from 'node:path';
import test from 'ava';
import tmp from 'tmp-promise';
import fs from 'fs-extra';
import sinon from 'sinon';
import Dchain from '../src/dchain.js';
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

test('installs configured deps that are not present', async (t) => {
  const { cwd } = t.context;
  const pkg = {};
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await dchain.initialize();
  dchain.spawn = sinon.fake();
  dchain.writePackageJson = sinon.fake();
  await dchain.manageDeps();
  t.true(dchain.spawn.calledOnce);
  t.true(dchain.writePackageJson.calledOnce);
  t.deepEqual(dchain.packageJson.devDependencies, _ncuResults);
  t.deepEqual(dchain.packageJson.dependencies, {});
});

test('installs configured deps that are not present and updates ones that are present', async (t) => {
  const { cwd } = t.context;
  const pkg = {
    devDependencies: {
      xo: '0.0.1'
    }
  };
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await dchain.initialize();
  dchain.spawn = sinon.fake();
  dchain.writePackageJson = sinon.fake();
  await dchain.manageDeps();
  t.true(dchain.spawn.calledOnce);
  t.true(dchain.writePackageJson.calledOnce);
  t.deepEqual(dchain.packageJson.devDependencies, _ncuResults);
  t.deepEqual(dchain.packageJson.dependencies, {});
});

test('installs configured deps that are not present and updates ones that are present in dependencies', async (t) => {
  const { cwd } = t.context;
  const pkg = {
    dependencies: {
      xo: '0.0.1'
    }
  };
  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg));
  const dchain = new Dchain({
    cwd,
    _ncuResults,
    silent: true,
    yes: true
  });
  await dchain.initialize();
  dchain.spawn = sinon.fake();
  dchain.writePackageJson = sinon.fake();
  await dchain.manageDeps();
  t.true(dchain.spawn.calledOnce);
  t.true(dchain.writePackageJson.calledOnce);
  t.deepEqual(dchain.packageJson.dependencies, { xo: _ncuResults.xo });
  const { xo, ...expectedDevDeps } = _ncuResults;
  t.deepEqual(dchain.packageJson.devDependencies, expectedDevDeps);
});
