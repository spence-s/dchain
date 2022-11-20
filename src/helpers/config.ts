export const defaultConfig = {
  package: true,
  gitInit: true,
  gitIgnore: true,
  husky: true,
  lintStaged: true,
  commitlint: true,
  xo: true,
  ava: true,
  typescript: true
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
