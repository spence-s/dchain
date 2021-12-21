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

/**
 * Determine if an object is empty or not
 *
 * @param {Object} object
 * @returns {Boolean}
 */
export const isEmpty = (object) =>
  object && Object.keys(object).length === 0 && object.constructor === Object;
