import { configMap } from '../../dist/src/helpers/config.js';

const testVersion = '^1.0.0';

export const _ncuResults = {};

for (const [, dep] of Object.entries(configMap)) {
  if (Array.isArray(dep)) for (const d of dep) _ncuResults[d] = testVersion;
  else _ncuResults[dep] = testVersion;
}
