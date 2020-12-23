/**
 * Return an immutable object from given digit and site.
 * Object has said digit and site as keys/value.
 *
 * @typedef {Number} Digit
 * @typedef {Number} Site
 * @typedef {{
 *  digit: Digit,
 *  site: Site
 * }} Identifier
 *
 * @param {Digit} digit
 * @param {Site} site
 * @return {Identifier}
 */
export function create (digit, site) {
  const obj = { digit, site }
  Object.freeze(obj)
  return obj
}

/**
 * Convert given array into immutable object.
 * Object has said digit and site as keys/value.
 *
 * @param {[Digit, Site]} array
 * @return {Identifier}
 */
export function ofArray (array) {
  return create(array[0], array[1])
}

/**
 * Convert given identifier into array.
 *
 * @param {Identifier} identifier
 * @return {[Digit, Site]}
 */
export function toArray (identifier) {
  return [identifier.digit, identifier.site]
}

/**
 * Compare identifier1 to identifier2.
 *
 * @param {Identifier} identifier1
 * @param {Identifier} identifier2
 * @return {Number} either -1, 0, 1
 */
export function compare (i1, i2) {
  if (i1.digit < i2.digit) {
    return -1
  } else if (i1.digit > i2.digit) {
    return 1
  } else {
    if (i1.site < i2.site) {
      return -1
    } else if (i1.site > i2.site) {
      return 1
    } else {
      return 0
    }
  }
}

/**
 * Compare if identifier1 is equal to identifier2.
 *
 * @param {Identifier} identifier1
 * @param {Identifier} identifier2
 * @return {Boolean}
 */
export function equals (i1, i2) {
  return i1.digit === i2.digit && i1.site === i2.site
}
