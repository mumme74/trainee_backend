
/**
 * Gets the classname cls
 * @param {object} cls The class to get name from
 * @returns {string} The defined name in JS code
 */
export const getClassName = (cls: object) => {
  const name = cls.constructor.name;
  return name !== 'Function' ? name :
    cls.toString().match(/^class\s+([a-z_0-9]+)/i)?.at(1) || ""
}