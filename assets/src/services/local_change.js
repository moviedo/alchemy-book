/**
 * Creates an immutable LocalChange object.
 *
 * @typedef {{
 *  from: import('codemirror').Position,
 *  to: import('codemirror').Position,
 *  text: String;
 * }} LocalChange
 *
 * @param {import('codemirror').Position} from
 * @param {import('codemirror').Position} to
 * @param {String} text
 * @return {LocalChange}
 */
export function create (from, to, text) {
  const obj = { from, to, text }
  Object.freeze(obj)
  return obj
}
