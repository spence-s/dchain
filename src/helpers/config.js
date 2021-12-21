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
  gitInit: true,
  gitIgnore: true,
  husky: true,
  lintStaged: true,
  commitlint: true,
  xo: true,
  ava: true
};

export const configMap = {
  package: 'fixpack',
  husky: 'husky',
  commitlint: ['@commitlint/cli', '@commitlint/config-conventional'],
  xo: 'xo',
  lintStaged: 'lint-staged'
};
