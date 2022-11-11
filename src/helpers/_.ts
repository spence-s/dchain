/**
 * filters own enumerable properties from an object
 */
export const pick = (
  object: Record<string, unknown>,
  picker: string[] | ((key: string, value?: unknown) => boolean)
): Record<string, unknown> => {
  const newObject: Record<string, unknown> = {};

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

export const isObject = (object: Record<string, unknown>): boolean =>
  Object.prototype.toString.call(object) === '[object Object]';

export const isEmpty = (object: unknown): boolean =>
  object === null ||
  object === undefined ||
  (Object.keys(object).length === 0 && object.constructor === Object);
