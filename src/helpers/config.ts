// eslint-disable-next-line @typescript-eslint/naming-convention
export const MANAGED_DEPS = [
  'husky',
  'xo',
  '@commitlint/cli',
  '@commitlint/config-conventional',
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
  package: [
    'prettier-plugin-packagejson',
    'npm-package-json-lint',
    'npm-package-json-lint-config-default'
  ],
  husky: 'husky',
  commitlint: ['@commitlint/cli', '@commitlint/config-conventional'],
  xo: 'xo',
  lintStaged: 'lint-staged',
  ava: 'ava'
};
