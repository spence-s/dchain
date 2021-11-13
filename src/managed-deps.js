export const MANAGED_DEPS = [
  'husky',
  'xo',
  '@commitlint/cli',
  '@commitlint/config-conventional',
  'fixpack',
  'nyc',
  'ava'
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
    prettier: true
  },
  js: {
    xo: true,
    prettier: true
  },
  test: {
    coverage: true,
    coverageThreshold: true,
    ava: true
  }
};
