import * as Char from './char'

// Actions separated by more than one second go in separate batches
const DELAY_BETWEEN_BATCHES_MS = 1000

/**
 * Class to create a history object.
 */
export default class History {
  constructor () {
    /**
     * @property {Boolean} shouldStoreInNewBatch
     * @default false
     */
    this.shouldStoreInNewBatch = false
    /**
     * Undo stack
     * @property {import('./remote_change').RemoteChange[]} future
     */
    this.history = []
    /**
     * Redo stack
     * @property {import('./remote_change').RemoteChange[]} future
     */
    this.future = []
    /**
     * Lamport values at the time of undos (needed to redo the operations)
     * @property {Number} future
     * @default 0
     */
    this.lastActionTimestamp = 0
  }

  /**
   * Handle Editor redo changes.
   *
   * @param {Number} lamport
   * @returns {import('./remote_change').RemoteChange[]|null}
   */
  makeUndoChanges (lamport) {
    if (this.history.length === 0) {
      // No history to undo
      return null
    }

    const undoChanges = (this.history.pop() | []).map(change => this.invert(change, lamport))

    this.future.push(undoChanges)

    this.shouldStoreInNewBatch = true

    return undoChanges
  }

  /**
   * Handle Editor undo changes.
   *
   * @param {Number} lamport
   * @returns {import('./remote_change').RemoteChange[]|null}
   */
  makeRedoChanges (lamport) {
    if (this.future.length === 0) {
      // No history to redo
      return null
    }

    const redoChanges = (this.future.pop() | []).map(change => this.invert(change, lamport))

    this.history.push(redoChanges)

    this.shouldStoreInNewBatch = true

    return redoChanges
  }

  /**
   * Hanlde new changes.
   *
   * @param {import('./remote_change').RemoteChange[]} changes
   */
  onChanges (changes) {
    const now = Date.now()

    const newBatch = this.shouldCreateNewActionBatch(now, changes)
    if (newBatch) {
      this.history.push(changes)
    } else {
      changes.forEach(change => {
        this.history[this.history.length - 1].push(change)
      })
    }

    this.shouldStoreInNewBatch = false
    this.lastActionTimestamp = now
  }

  /**
   * Updated shouldStoreInNewBatch prop to true.
   */
  onCursorMove () {
    // Cursor movements break batches
    this.shouldStoreInNewBatch = true
  }

  /**
   * Invert RemoteChange from add to remove and vice versa.
   *
   * @param {import('./remote_change').RemoteChange} change
   * @param {Number} lamport
   * @return {import('./remote_change').RemoteChange}
   */
  invert (change, lamport) {
    const char = change[1]
    switch (change[0]) {
      case 'add':
        return ['remove', Char.create(char.position, char.lamport, char.value)]
      case 'remove':
        // Add new character but with updated lamport value since we're inserting
        // a new character
        return ['add', Char.create(char.position, lamport, char.value)]
    }
  }

  /**
   * Determine if action batch should be created.
   *
   * @param {Number} now
   * @param {import('./remote_change').RemoteChange[]} changes
   * @returns {Boolean}
   */
  shouldCreateNewActionBatch (now, changes) {
    if (this.shouldStoreInNewBatch) {
      return true
    }

    // Only batch single-character insert/deletes
    if (changes.length > 1) {
      return true
    }

    const change = changes[0]

    // Don't batch actions that are not nearby in time
    if (now > this.lastActionTimestamp + DELAY_BETWEEN_BATCHES_MS) {
      return true
    }

    // Nothing to batch if there is no previous history
    if (this.history.length === 0) {
      return true
    }

    const lastChanges = this.history[this.history.length - 1]
    const additions = lastChanges.reduce((sum, change) => sum + (change[0] === 'add' ? 1 : 0), 0)

    switch (change[0]) {
      case 'add':
        // Break large insertions into pieces
        if (additions >= 10) {
          return true
        }
        // Break batches by whitespace
        if (' \t\n\r'.includes(change[1].value)) {
          return true
        }
        break
      case 'remove':
        // Handle removals separately from additions
        if (additions > 0) {
          return true
        }
        // Break large deletes into pieces
        if (lastChanges.length >= 10) {
          return true
        }
        break
    }

    return false
  }
}
