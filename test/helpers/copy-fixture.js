import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const copyFixture = async (relpath, temporaryDir) => {
  await fs.copy(path.join(__dirname, '..', 'fixtures', relpath), temporaryDir);
};
