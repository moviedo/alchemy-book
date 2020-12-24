import { List } from 'immutable'
import * as LocalChange from './local_change'
import * as Char from './char'

/**
 * Find index of newline Char in given line.
 *
 * @param {List<import('./char').Char>} line
 * @return {Number}
 */
function findNewline (line) {
  return line.findIndex(char => char.value === '\n')
}

/**
 * Remove given local change item from current linear crdt.
 *
 * @typedef {List<List<import('./char').Char>>} MultiCharList
 * @typedef {Array<import('./char').Char>} RemovedChar
 * @param {MultiCharList} crdt
 * @param {LocalChange.LocalChange} change
 * @return {[MultiCharList, RemovedChar]}
 */
function updateCrdtRemove (crdt, change) {
  const lines = crdt.slice(change.from.line, change.to.line + 1)

  const linesAndUpdates = lines.map((line, index) => {
    let startIndex
    let endIndex
    if (index === 0) {
      // First line
      startIndex = change.from.ch
    } else {
      startIndex = 0
    }
    if (index === lines.size - 1) {
      // Last line
      endIndex = change.to.ch
    } else {
      endIndex = line.size
    }
    const toRemove = line.slice(startIndex, endIndex)
    if (toRemove.size !== endIndex - startIndex) {
      throw new Error('size does not match')
    }
    const updatedLine = line.splice(startIndex, endIndex - startIndex).toList()
    return [updatedLine, toRemove]
  })
  const updatedLines = linesAndUpdates.map(tuple => tuple[0])
  const toRemove = linesAndUpdates.flatMap(tuple => tuple[1])

  // Only the first and last line should be non-empty, so we just keep those.
  let newCrdt
  if (lines.size === 1) {
    newCrdt = crdt.set(change.from.line, updatedLines.first())
  } else {
    const remainingLine = updatedLines
      .first()
      .concat(updatedLines.last())
      .toList()
    newCrdt = crdt.splice(change.from.line, lines.size, remainingLine).toList()
  }

  return [newCrdt, toRemove.toArray()]
}

/**
 *
 * @param {MultiCharList} crdt
 * @param {Number} lamport
 * @param {Number} site
 * @param {LocalChange.LocalChange} change
 * @return {[MultiCharList, RemovedChar]}
 */
function updateCrdtInsert (crdt, lamport, site, change) {
  const { line: lineIndex, ch } = change.from
  const line = crdt.get(lineIndex)
  const [before, after] = splitLineAt(line, ch)

  // For now, just insert characters one at a time. Eventually, we may
  // want to generate fractional indices in a more clever way when many
  // characters are inserted at the same time.
  let previousChar = getPrecedingChar(crdt, lineIndex, ch)
  const nextChar = getCharAt(crdt, lineIndex, ch)
  let currentLine = before
  const lines = []
  const addedChars = []
  Array.from(change.text).forEach(addedChar => {
    const newPosition = Char.generatePositionBetween(
      previousChar.position,
      nextChar.position,
      site
    )
    const newChar = Char.create(newPosition, lamport, addedChar)
    currentLine = currentLine.push(newChar)
    if (addedChar === '\n') {
      lines.push(currentLine)
      currentLine = List()
    }

    addedChars.push(newChar)

    previousChar = newChar
  })

  currentLine = currentLine.concat(after).toList()
  lines.push(currentLine)

  const updatedCrdt = crdt.splice(lineIndex, 1, ...lines).toList()
  return [updatedCrdt, addedChars]
}

/**
 * Split given line at position at.
 *
 * @param {List<import('./char').Char>} line
 * @param {Number} at
 * @returns {[List<import('./char').Char>, List<import('./char').Char>]}
 */
function splitLineAt (line, at) {
  const before = line.slice(0, at).toList()
  const after = line.slice(at, line.size).toList()
  return [before, after]
}

/**
 * Get Char in crdt at given lineIndex and before given ch.
 *
 * @param {MultiCharList} crdt
 * @param {Number} lineIndex
 * @param {Number} ch
 * @returns {import('./char').Char}
 */
function getPrecedingChar (crdt, lineIndex, ch) {
  if (ch === 0) {
    if (lineIndex === 0) {
      return Char.startOfFile()
    } else {
      return crdt.get(lineIndex - 1).last()
    }
  } else {
    return crdt.get(lineIndex).get(ch - 1)
  }
}

/**
 * Get Char in crdt at given lineIndex and ch.
 *
 * @param {MultiCharList} crdt
 * @param {Number} lineIndex
 * @param {Number} ch
 * @returns {import('./char').Char}
 */
function getCharAt (crdt, lineIndex, ch) {
  const line = crdt.get(lineIndex)
  if (ch >= line.size) {
    if (lineIndex === crdt.size - 1 && ch === line.size) {
      return Char.endOfFile()
    } else {
      throw Error('indexing out of bounds')
    }
  } else {
    return line.get(ch)
  }
}

/**
 * Compare given item with line.
 *
 * @param {import('./char').Char} item
 * @param {List<import('./char').Char>} line
 * @returns {Number}
 */
function compareCharWithLine (item, line) {
  // Only the last line might have size 0 because all other lines end with a
  // newline
  if (line.size === 0) {
    return Char.compare(item, Char.endOfFile())
  } else {
    return Char.compare(item, line.get(0))
  }
}

/**
 * If found: return the line number and column number of the character
 * If not found: return the line number and column number of the character
 * where it should be if inserted
 *
 * @param {MultiCharList} crdt
 * @param {import('./char').Char} char
 * @returns {Array<Number, Number, "found" | "not_found">}
 */
function findPosition (crdt, char) {
  // Putting something at the start of the first line (lineIndex == -1) should be in line 0
  const lineIndex = Math.max(0, binarySearch(crdt, char, compareCharWithLine, 'before'))
  const line = crdt.get(lineIndex)
  const charIndex = binarySearch(line, char, Char.compare, 'at')
  if (charIndex < line.size) {
    const found = Char.compare(crdt.get(lineIndex).get(charIndex), char) === 0
    return [lineIndex, charIndex, found ? 'found' : 'not_found']
  } else {
    const isAfterNewline = charIndex === line.size && lineIndex !== crdt.size - 1
    // All lines except the last one need to end in a newline, so put this character
    // on the next line if it would go at the end of the line.
    if (isAfterNewline) {
      return [lineIndex + 1, 0, 'not_found']
    } else {
      return [lineIndex, charIndex, 'not_found']
    }
  }
}

/**
 * Return the index of the item if found
 * If not found, return the index of the character where it should be if inserted when using "at"
 * return the index of the character that precedes it when using "before"
 *
 * @template {*} U
 * @template {*} V
 * @typedef {(a: V, b: U) => number} Comparator
 * @param {List<U>} list
 * @param {V} item
 * @param {Comparator} comparator
 * @param {"at" | "before"} notFoundBehavior
 * @returns {Number}
 */
export function binarySearch (list, item, comparator, notFoundBehavior) {
  return _binarySearch(0, list.size)

  /**
   * Implments binarySearch recursively.
   *
   * @param {Number} start
   * @param {Number} end
   * @returns {Number}
   */
  function _binarySearch (start, end) {
    if (start >= end) {
      switch (notFoundBehavior) {
        case 'at':
          return start
        case 'before':
          return start - 1
        default:
          throw new Error('Unknown behavior')
      }
    } else {
      const mid = Math.floor((start + end) / 2)
      const comp = comparator(item, list.get(mid))
      if (comp < 0) {
        return _binarySearch(start, mid)
      } else if (comp > 0) {
        return _binarySearch(mid + 1, end)
      } else {
        return mid
      }
    }
  }
}

/**
 * Create LinearCrdt instance.
 */
export class LinearCrdt {
  /**
   * Initialize crdt proprety
   *
   * @param {Array<import('./char').Serial>} init
   */
  init (init) {
    let line = List()
    let lines = List()
    init.forEach(serial => {
      const char = Char.ofArray(serial)
      if (char.value === '\n') {
        line = line.push(char)
        lines = lines.push(line)
        line = List()
      } else {
        line = line.push(char)
      }
    })

    /**
     * @property {MultiCharList}
     */
    this.crdt = lines.push(line)
  }

  /**
   * Return crdt property to string representation.
   *
   * @returns {String}
   */
  toString () {
    return this.crdt.map(line => line.map(char => char.value).join('')).join('')
  }

  /**
   * Remotely insert given char into crdt line.
   *
   * @param {import('./char').Char} char
   * @returns {LocalChange.LocalChange | null}
   */
  remoteInsert (char) {
    const [lineIndex, ch, found] = findPosition(this.crdt, char)
    const line = this.crdt.get(lineIndex)
    if (found === 'not_found') {
      const change = LocalChange.create(
        { line: lineIndex, ch },
        { line: lineIndex, ch },
        char.value
      )
      if (char.value === '\n') {
        const [before, after] = splitLineAt(line, ch)
        this.crdt = this.crdt.splice(lineIndex, 1, ...[before.push(char), after]).toList()
        return change
      } else {
        this.crdt = this.crdt.set(lineIndex, line.insert(ch, char))
        return change
      }
    } else {
      // Probably means we got a duplicate for some reason
      return null
    }
  }

  /**
   * Remotely delete given char into crdt line.
   *
   * @param {import('./char').Char} char
   * @returns {LocalChange.LocalChange | null}
   */
  remoteDelete (char) {
    const [lineIndex, ch, found] = findPosition(this.crdt, char)
    const line = this.crdt.get(lineIndex)
    if (found === 'found' && Char.equals(line.get(ch), char)) {
      const newLine = line.remove(ch)
      const nextLine = this.crdt.get(lineIndex + 1)

      if (findNewline(newLine) < 0 && nextLine) {
        // Newline character was removed, need to join with the next line
        const change = LocalChange.create(
          { line: lineIndex, ch },
          { line: lineIndex + 1, ch: 0 },
          ''
        )
        this.crdt = this.crdt.splice(lineIndex, 2, newLine.concat(nextLine)).toList()
        return change
      } else {
        const change = LocalChange.create(
          { line: lineIndex, ch },
          { line: lineIndex, ch: ch + 1 },
          ''
        )
        this.crdt = this.crdt.set(lineIndex, newLine)
        return change
      }
    } else {
      // Probably means we got a duplicate for some reason
      return null
    }
  }

  /**
   * Locally insert given char into crdt line.
   *
   * @param {Numbder} lamport
   * @param {Numbder} site
   * @param {LocalChange.LocalChange} change
   * @returns {Array<import('./char').Char>}
   */
  localInsert (lamport, site, change) {
    const [newCrdt, remoteChanges] = updateCrdtInsert(this.crdt, lamport, site, change)
    this.crdt = newCrdt
    return remoteChanges
  }

  /**
   * Remotely delete given char into crdt line.
   *
   * @param {LocalChange.LocalChange} change
   * @returns {Array<import('./char').Char>}
   */
  localDelete (change) {
    const [newCrdt, remoteChanges] = updateCrdtRemove(this.crdt, change)
    this.crdt = newCrdt
    return remoteChanges
  }
}
