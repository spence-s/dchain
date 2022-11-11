import fs from 'node:fs/promises';
import prettier from 'prettier';
import type Lassify from '../lassify.js';

async function writePackageFile(this: Lassify) {
  const prettierConfig =
    (await prettier.resolveConfig(this.pkgPath, {
      editorconfig: true,
      useCache: false
    })) || {};

  prettierConfig.parser = 'json-stringify';

  const text = prettier.format(
    JSON.stringify(this.packageJson),
    prettierConfig
  );

  await fs.writeFile(this.pkgPath, text);
}

export default writePackageFile;
