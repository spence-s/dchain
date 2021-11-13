export const MANAGED_DEPS = [
  'husky',
  'xo',
  'eslint',
  '@commitlint/cli',
  '@commitlint/config-conventional',
  'eslint-config-xo-lass',
  'fixpack',
  'nyc',
  'remark-cli',
  'remark-preset-github',
  'remark-preset-lint-reccomended',
  'remark-preset-lint-markdown-style-guide',
  'remark-preset-prettier',
  'prettier',
  'stylelint',
  'stylelint-config-xo'
];

export const defaultConfig = {
  package: true,
  git: {
    init: true,
    ignore: true,
    husky: true,
    'lint-staged': true,
    commitlint: true
  },
  md: {
    remark: true,
    prettier: true
  },
  js: {
    xo: true,
    eslint: false,
    prettier: true
  },
  test: {
    coverage: true,
    coverageThreshold: true,
    ava: true
  }
};
