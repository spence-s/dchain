import process from 'node:process';
import { resolve } from 'node:path';
import { execa } from 'execa';
import debug from 'debug';

import type { ExecaChildProcess, Options as ExecaOptions } from 'execa';
import type { Ora } from 'ora';
import type { Debugger } from 'debug';
import type { Answers } from 'prompts';
import type { PackageJson } from 'type-fest';
import type { FakeOra } from './helpers/ora-debug-redirect.js';

import initialize from './modules/initialize.js';
import manageGitInit from './modules/git-init.js';
import manageGitIgnore from './modules/git-ignore.js';
import manageDeps from './modules/dependencies.js';
import manageLintStaged from './modules/lint-staged.js';
import manageEditorConfig from './modules/editor-config.js';
import managePkg from './modules/pkg.js';
import manageTs from './modules/typescript.js';

import manageHusky from './modules/husky.js';

import ora from './helpers/ora-debug-redirect.js';
import writePackageJson from './helpers/write-package-file.js';
import { configMap, defaultConfig } from './helpers/config.js';

export type Config = {
  package?: boolean;
  gitInit?: boolean;
  gitIgnore?: boolean;
  husky?: boolean;
  lintStaged?: boolean;
  commitlint?: boolean;
  xo?: boolean;
  ava?: boolean;
};

export type LassifyOptions = {
  debug?: Debugger;
  cwd?: string;
  yes?: boolean;
  _config?: Config;
  config?: string;
  silent?: boolean;
  _ncuResults?: Record<string, string>;
};

export class Dchain {
  debug: debug.Debugger;
  cwd: string;
  yes: boolean;
  configPath?: string;
  config: Config;
  defaultConfig: Config;
  configMap: Record<string, string | string[]>;
  spinner: Ora | FakeOra;
  spawn: (
    cmd: string,
    args?: string[],
    runOptions?: ExecaOptions
  ) => ExecaChildProcess;

  packageJson: PackageJson;
  originalPackageJson: Readonly<PackageJson>;
  pkgPath: string;
  managedDependencies: string[];

  originalDependencies: Readonly<Record<string, unknown>>;
  ncuResults: PackageJson.Dependency;
  promptAnswers?: Answers<string>;
  pm: 'npm' | 'yarn' | 'pnpm' | '';
  writePackageJson: typeof writePackageJson;
  initialize: typeof initialize;
  managePkg: typeof managePkg;
  manageGitInit: typeof manageGitInit;
  editorConfig: typeof manageEditorConfig;
  manageGitIgnore: typeof manageGitIgnore;
  manageDeps: typeof manageDeps;
  manageHusky: typeof manageHusky;
  manageLintStaged: typeof manageLintStaged;
  manageTs: typeof manageTs;

  constructor(options?: LassifyOptions) {
    this.debug = debug('dchain');
    this.cwd = options?.cwd ? resolve(options.cwd) : process.cwd();
    this.debug(`cwd: ${this.cwd}`);
    this.yes = options?.yes ?? false;
    this.configPath = options?.config;
    this.ncuResults = options?._ncuResults ?? {};
    this.config = options?._config ?? {};
    this.configMap = configMap;
    this.defaultConfig = defaultConfig;
    this.spinner = ora({ isSilent: options?.silent });
    this.spawn = (cmd, args, runOptions) =>
      execa(cmd, args, { stdio: 'inherit', cwd: this.cwd, ...runOptions });
    this.packageJson = {};
    this.originalPackageJson = {};
    this.originalDependencies = {};
    this.managedDependencies = [];
    this.pm = '';
    this.pkgPath = '';
    this.initialize = initialize.bind(this);
    this.manageGitInit = manageGitInit.bind(this);
    this.manageGitIgnore = manageGitIgnore.bind(this);
    this.editorConfig = manageEditorConfig.bind(this);
    this.managePkg = managePkg.bind(this);
    this.manageDeps = manageDeps.bind(this);
    this.manageLintStaged = manageLintStaged.bind(this);
    this.manageHusky = manageHusky.bind(this);
    this.writePackageJson = writePackageJson.bind(this);
    this.manageTs = manageTs.bind(this);
  }

  /**
   * order is important here as methods
   * may set variables for use by later functions
   */
  async run() {
    try {
      await this.initialize();
      await this.managePkg();
      await this.manageGitInit();
      await this.editorConfig();
      await this.manageGitIgnore();
      await this.manageDeps();
      await this.manageHusky();
      await this.manageLintStaged();
      await this.manageTs();
    } catch (error: unknown) {
      if (error instanceof Error) this.spinner.fail(error.message);
    }
  }
}

export default Dchain;
