import path from 'node:path';
import fs from 'fs-extra';
import prettier from 'prettier';

export const writeConf = async (conf, filePath, packageJson) => {
  const prettierConfig =
    (await prettier.resolveConfig(filePath, {
      eidtorConfig: true,
      useCache: false
    })) || {};

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

  await fs.writeFile(filePath, text);
};
