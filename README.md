# dchain

[![build status](https://img.shields.io/travis/com/lassjs/dchain.svg)](https://travis-ci.com/lassjs/dchain)
[![code coverage](https://img.shields.io/codecov/c/github/lassjs/dchain.svg)](https://codecov.io/gh/lassjs/dchain)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/lassjs/dchain.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dt/dchain.svg)](https://npm.im/dchain)

> Lass inspired cli for managing dev dependency tool chain

## Table of Contents

- [About](#about)
- [Install](#install)
- [Usage](#usage)
- [Contributors](#contributors)
- [License](#license)

## About

Inspired by [lass](https://github.com/lassjs/lass), dchain installs and manages your dev dependency tool chain in any project.

Currently dchain is work-in-progress and installs and sets up husky and lint-staged. In the future we hope to fully and intelligently manage dev dependency upgrade paths and migrations in your project as APIs change, including properly migrating any current configurations that you have that do not line up with our default configurations. For example, running `dchain` in a project with husky v3 and lint-staged v3 will properly take all the current configurations and properly set them up for the newest APIs and remove your old configurations with no breaks. Currently we simply install the newest versions and set up default configurations for these tools.

## Install

[npm][]:

```sh
npm install dchain
```

[yarn][]:

```sh
yarn add dchain
```

## Usage

```
  cli for lass

  Run dchain at the root of any project to install and manage your devDependencies.

  Usage:
    $ dchain [options]

  Options
    --cwd   Optional directory to run the cli from. Defaults to process.cwd().

  Examples
    $ dchain
    $ dchain --cwd '../other/directory'
```

## Similar Efforts

- [mrm](https://github.com/sapegin/mrm)

## Contributors

| Name               | Website                    |
| ------------------ | -------------------------- |
| **Spencer Snyder** | <https://spencersnyder.io> |

## License

[MIT](LICENSE) © [Spencer Snyder](https://spencersnyder.io)

##

[npm]: https://www.npmjs.com/
[yarn]: https://yarnpkg.com/
