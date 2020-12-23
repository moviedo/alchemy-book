import * as Identifier from './identifier'

export const BASE = 256
export const DIVISOR = 16

/**
 * Return array of digit data from given identifiers array.
 *
 * @param {Array<Identifier.Identifier>} identifiers
 * @return {Array}
 */
export function fromIdentifierList (identifiers) {
  return identifiers.map(ident => ident.digit)
}

/**
 *
 *
 * @param {Array<Number>} n
 * @param {Array<Identifier.Identifier>} before
 * @param {Array<Identifier.Identifier>} after
 * @param {Number} creationSite
 * @return {Identifier.Identifier}
 */
export function toIdentifierList (n, before, after, creationSite) {
  // Implements the constructPosition rules from the Logoot paper
  return n.map((digit, index) => {
    if (index === n.length - 1) {
      return Identifier.create(digit, creationSite)
    } else if (index < before.length && digit === before[index].digit) {
      return Identifier.create(digit, before[index].site)
    } else if (index < after.length && digit === after[index].digit) {
      return Identifier.create(digit, after[index].site)
    } else {
      return Identifier.create(digit, creationSite)
    }
  })
}

/**
 * Calculate (n1 - n2) where n1 > n2
 *
 * @param {Identifier.Identifier} n1
 * @param {Identifier.Identifier} n2
 * @return {Array<Number>}
 */
export function subtractGreaterThan (n1, n2) {
  let carry = 0
  const diff = Array(Math.max(n1.length, n2.length))
  for (let i = diff.length - 1; i >= 0; i--) {
    const d1 = (n1[i] || 0) - carry
    const d2 = n2[i] || 0
    if (d1 < d2) {
      carry = 1
      diff[i] = d1 + BASE - d2
    } else {
      carry = 0
      diff[i] = d1 - d2
    }
  }
  return diff
}

/**
 * Calculate (n1 + n2), throw error if the sum is >= 1
 *
 * @param {Identifier.Identifier} n1
 * @param {Identifier.Identifier} n2
 * @return {Array<Number>}
 */
export function add (n1, n2) {
  let carry = 0
  const diff = Array(Math.max(n1.length, n2.length))
  for (let i = diff.length - 1; i >= 0; i--) {
    const sum = (n1[i] || 0) + (n2[i] || 0) + carry
    carry = Math.floor(sum / BASE)
    diff[i] = sum % BASE
  }
  if (carry !== 0) {
    throw new Error('sum is greater than one, cannot be represented by this type')
  }
  return diff
}

/**
 * Increment n1 by a value much smaller than delta, in such a way
 * that the last digit of the result is not zero.
 *
 * @param {Identifier.Identifier} n1
 * @param {Array<Number>} n2
 * @return {Array<Number>}
 */
export function increment (n1, delta) {
  const firstNonzeroDigit = delta.findIndex(x => x !== 0)
  const inc = delta.slice(0, firstNonzeroDigit).concat([0, 1])

  const v1 = add(n1, inc)
  const v2 = v1[v1.length - 1] === 0 ? add(v1, inc) : v1
  return v2
}
