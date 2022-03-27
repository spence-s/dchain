import process from 'node:process';
import { resolve } from 'node:path';
import { execa } from 'execa';
import debug from 'debug';

import initialize from './modules/initialize.js';
import manageGitInit from './modules/git-init.js';
import manageGitIgnore from './modules/git-ignore.js';
import manageDeps from './modules/dependencies.js';
import manageLintStaged from './modules/lint-staged.js';
import manageEditorConfig from './modules/editor-config.js';
import managePkg from './modules/pkg.js';

import manageHusky from './modules/husky.js';

import ora from './helpers/ora-debug-redirect.js';
import writePackageJson from './helpers/write-package-file.js';
import { configMap, defaultConfig } from './helpers/config.js';

class Lassify {
  constructor(options) {
    this.debug = debug('lassify');
    this.cwd = options.cwd ? resolve(options.cwd) : process.cwd();
    this.debug(`cwd: ${this.cwd}`);
    this.yes = options.yes || false;
    this.configPath = options.config;

    // todo: should remove these and just merge in manually in tests
    this.ncuResults = options._ncuResults;
    this.config = options._config;

    this.configMap = configMap;
    this.defaultConfig = defaultConfig;

    this.spinner = ora({ isSilent: options.silent });
    this.spawn = (cmd, args, runOptions) =>
      execa(cmd, args, { stdio: 'inherit', cwd: this.cwd, ...runOptions });

    this.initialize = initialize.bind(this);
    this.manageGitInit = manageGitInit.bind(this);
    this.manageGitIgnore = manageGitIgnore.bind(this);
    this.editorConfig = manageEditorConfig.bind(this);
    this.managePkg = managePkg.bind(this);
    this.manageDeps = manageDeps.bind(this);
    this.manageLintStaged = manageLintStaged.bind(this);
    this.manageHusky = manageHusky.bind(this);
    this.writePackageJson = writePackageJson.bind(this);
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
    } catch (error) {
      this.spinner.fail(error.message);
    }
  }
}

export default Lassify;
