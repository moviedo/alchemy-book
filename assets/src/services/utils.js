/*
 * Functional-style list operations for convenience and code clarity.
 * Use only on small arrays!
 */

/**
 * Add new array itme, head, to front of given array, rest.
 * Return new array.
 *
 * @param {*} head
 * @param {Array} rest
 * @return {Array}
 */
export function cons (head, rest) {
  return [head].concat(rest)
}

/**
 * Return first item in given list.
 *
 * @param {Array} list
 * @return {*}
 */
export function head (list) {
  return list[0]
}

/**
 * Return array after first position.
 *
 * @param {Array} list
 * @return {Array}
 */
export function rest (list) {
  return list.slice(1)
}
