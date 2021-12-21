module.exports = {
  "*.md,!test/**/*.md": "prettier --check",
  './package.json': 'fixpack --dryrun',
  '*.js': 'xo --fix'
};
