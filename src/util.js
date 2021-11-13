import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import execa from 'execa';

export const filename = (metaUrl) => fileURLToPath(metaUrl);

export const dirname = (metaUrl) => path.dirname(fileURLToPath(metaUrl));

export const getCtx = (rel) => path.join(process.cwd(), rel || '');

export const createSpawn = (options) => (cmd, args) =>
  execa(cmd, args, { stdio: 'inherit', ...options });

/**
 * Determine if an object is empty or not
 *
 * @param {Object} object
 * @returns {Boolean}
 */
export const isEmpty = (object) =>
  object && Object.keys(object).length === 0 && object.constructor === Object;

/**
 * filters own enumerable properties from an object
 *
 * @param {Object} object - input object
 * @param {function|string[]} picker - array or function
 * @returns {Object} - a new filtered object
 */
export const pick = (object, picker) => {
  const newObject = {};

  if (Array.isArray(picker)) {
    const set = new Set(picker);
    picker = (key) => set.has(key);
  }

  if (typeof picker !== 'function')
    throw new Error('Picker must be a function');

  for (const [key, value] of Object.entries(object))
    if (picker(key, value)) newObject[key] = object[key];

  return newObject;
};

export const isObject = (object) =>
  Object.prototype.toString.call(object) === '[object Object]';
