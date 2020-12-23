/**
 * Creates an add RemoteChange object from given Char object.
 *
 * @typedef {["add" | "remove", import('./char').Char]} RemoteChange
 *
 * @param {import('./char').Char} char
 */
export function add (char) {
  return ['add', char]
}

/**
 * Creates a remove RemoteChange object from given Char object.
 *
 * @param {import('./char').Char} char
 */
export function remove (char) {
  return ['remove', char]
}
