import fs from 'fs-extra';
import prettier from 'prettier';

async function writePackageFile() {
  const prettierConfig =
    (await prettier.resolveConfig(this.pkgPath, {
      editorConfig: true,
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
