import path from 'node:path';
import fs from 'node:fs/promises';
import prettier from 'prettier';
import type { PackageJson } from 'type-fest';

export const writeConf = async (
  conf: Record<string, unknown>,
  filePath: string,
  packageJson: PackageJson
): Promise<void> => {
  const prettierConfig =
    (await prettier.resolveConfig(filePath, {
      editorconfig: true,
      useCache: false
    })) ?? {};

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const isESM = packageJson.type === 'module';
  const ext = path.extname(filePath);

  let text;
  if (!isESM && ['.js', '.cjs'].includes(ext)) {
    text = prettier.format(
      `module.exports = ${JSON.stringify(conf)}`,
      prettierConfig
    );
  } else if (isESM || ext === '.mjs') {
    text = prettier.format(
      `export default ${JSON.stringify(conf)}`,
      prettierConfig
    );
  } else if (ext === '.json' || ext === '') {
    prettierConfig.parser = 'json5';
    text = prettier.format(JSON.stringify(conf), prettierConfig);
  } else if (ext === '.yaml' || ext === '.yml') {
    prettierConfig.parser = 'yaml';
    text = prettier.format(JSON.stringify(conf), prettierConfig);
  }

  if (text) await fs.writeFile(filePath, text);
};