import * as CodeMirror from 'codemirror'

import { updateAndConvertLocalToRemote, updateAndConvertRemoteToLocal } from './crdt'
import { LinearCrdt } from './crdt_linear'
import History from './history'
import * as RemoteCursor from './remote_cursor'

const IGNORE_REMOTE = 'ignore_remote'
const UNDO_REDO = 'undo_redo'
const INITIALIZE = 'setValue'

const MAX_CHAR_COUNT = 2500

/**
 * Create editor instance.
 */
export default class Editor {
  /**
   * @typedef {(exceeded: boolean) => undefined} LimitCallback
   * @param {HTMLTextAreaElement} domNode
   * @param {import('./editor_socket').default} editorSocket
   * @param {LimitCallback} limitCallback
   */
  constructor (domNode, editorSocket, limitCallback) {
    /**
     * @property {CodeMirror.Editor}
     */
    this.codemirror = CodeMirror.fromTextArea(domNode, {
      lineNumbers: true,
      theme: 'zenburn'
    })
    this.codemirror.on('beforeChange', this.beforeChange)
    this.codemirror.on('change', this.onLocalChange)
    this.codemirror.on('cursorActivity', this.onLocalCursor)
    this.codemirror.on('keyup', this.onKeyUp)
    /**
     * @property {import('./editor_socket').defaultocket}
     */
    this.editorSocket = editorSocket
    this.editorSocket.connect(this.onInit, this.onRemoteChange)
    /**
     * Map user_id -> site_id -> cursor element
     * Since the same user could have the same document open on multiple tabs,
     * thus have multiple sites.
     *
     * @property {Map<Number, Map<Number, RemoteCursor.RemoteCursor>>}
     */
    this.cursorWidgets = new Map()
    /**
     * @property {LimitCallback}
     */
    this.limitCallback = limitCallback
    /**
     * @property {History}
     */
    this.history = new History()
    /**
     * @property {Boolean}
     */
    this.exceededLimit = false
  }

  /**
   * Note: this method is currently inefficient in that any one cursor
   * movement causes all others to be redraw. However, there should be
   * few cursors in total so this is probably not going to be a concern.
   *
   * @param {Array<import('./editor_socket').UserPresence>} presences
   */
  updateCursors (presences) {
    const cursorsToDelete = this.allCursors()
    presences.forEach(presence => {
      // Don't draw a remote cursor for your own instance!
      if (presence.siteId !== this.site) {
        const cursor = this.getCursorFor(presence)
        cursor.moveTo(presence.cursor)

        cursorsToDelete.delete(cursor)
      }
    })

    // Remaining cursors are probably from old sessions, remove them
    cursorsToDelete.forEach(cursor => {
      cursor.detach()
      this.cursorWidgets.get(cursor.userId).delete(cursor.siteId)
    })
  }

  /**
   * @param {CodeMirror.Editor} editor
   * @param {CodeMirror.EditorChangeCancellable} change
   */
  beforeChange (editor, change) {
    if (change.origin === 'undo' || change.origin === 'redo') {
      // We use custom CRDT logic to handle undo/redo history, don't use CodeMirror's
      change.cancel()

      // This is just to prevent CodeMirror's history from taking up memory
      this.codemirror.getDoc().clearHistory()

      if (change.origin === 'undo') {
        setTimeout(() => this.undo(), 0)
      }
      // setTimeout(() => this.redo(), 0);
    } else {
      let editorCharCount = 0
      // The +1s are to count newline characters
      editor.getDoc().eachLine(line => {
        editorCharCount += line.text.length + 1
      })
      let delta = 0
      if (change.text) {
        change.text.forEach(line => {
          delta += line.length + 1
        })
      }
      if (change.removed) {
        change.removed.forEach(line => {
          delta -= line.length + 1
        })
      }

      const exceededLimit = editorCharCount + delta > MAX_CHAR_COUNT
      if (delta > 0 && exceededLimit && change.origin !== INITIALIZE) {
        change.cancel()
      }
      if (exceededLimit !== this.exceededLimit) {
        this.limitCallback(exceededLimit)
      }
      this.exceededLimit = exceededLimit
    }
  }

  /**
   *
   * @param {CodeMirror.Editor} editor
   * @param {KeyboardEvent} e
   */
  onKeyUp (editor, e) {
    const hasModifier = e.ctrlKey || e.metaKey

    // This doesn't work on Mac, no key event is registered. So instead,
    // rely on CodeMirror's event in beforeChange.
    // if (hasModifier && !e.shiftKey && e.key.toLowerCase() === "z") {
    //     e.preventDefault();
    //     this.undo();
    // }

    // But I don't know how to get redo working, because I'm not using CodeMirror's
    // history so it won't give me a redo event. Redo will only work on Windows
    // for now I guess.
    if (
      (hasModifier && !e.shiftKey && e.key.toLowerCase() === 'y') ||
      (hasModifier && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault()
      this.redo()
    }
  }

  /**
   * @param {CodeMirror.Editor} editor
   */
  onLocalCursor (editor) {
    this.editorSocket.sendCursor(editor.getDoc().getCursor())

    const currentPosition = this.codemirror.getDoc().getCursor()
    if (this.previousCursorPosition) {
      if (
        currentPosition.ch !== this.previousCursorPosition.ch ||
        currentPosition.line !== this.previousCursorPosition.line
      ) {
        this.history.onCursorMove()
      }
    }

    /**
     * This stores the previous cursor position in order to know if the cursor
     * has actually moved when cursorActivity gets triggered. We are only
     * interested in cursor movements that are not due to edits, so edits
     * will update `previousCursorPosition` before the cursor callback gets
     * triggered.
     * @property {CodeMirror.Position}
     */
    this.previousCursorPosition = currentPosition
  }

  /**
   * @param {CodeMirror.Editor} editor
   * @param {CodeMirror.EditorChange} change
   */
  onLocalChange (editor, change) {
    const isUserInput = ![IGNORE_REMOTE, UNDO_REDO, INITIALIZE].includes(change.origin)
    if (isUserInput) {
      this.lamport = this.lamport + 1
      const changes = updateAndConvertLocalToRemote(this.crdt, this.lamport, this.site, change)
      this.history.onChanges(changes)
      changes.forEach(change => this.editorSocket.sendChange(change, this.lamport))
    }

    this.previousCursorPosition = this.codemirror.getDoc().getCursor()
  }

  /**
   * @param {{ change: import('./remote_change').RemoteChange, lamport: Number}} param0
   */
  onRemoteChange ({ change, lamport }) {
    /**
   * @property {Number}
   */
    this.lamport = Math.max(this.lamport, lamport) + 1
    this.convertRemoteToLocal(change)

    this.previousCursorPosition = this.codemirror.getDoc().getCursor()
  }

  /**
   * @param {{state: Array<import('./char').Serial> ,site: Number}} resp
   */
  onInit (resp) {
    /**
     * @property {Crdt}
     */
    this.crdt = new LinearCrdt()
    this.crdt.init(resp.state)

    /**
     * @property {Number}
     */
    this.site = resp.site
    this.lamport = 0
    this.codemirror.setValue(this.crdt.toString())
  }

  undo () {
    this.lamport = this.lamport + 1
    this.applyUndoAndRedo(this.history.makeUndoChanges(this.lamport))
  }

  redo () {
    this.lamport = this.lamport + 1
    this.applyUndoAndRedo(this.history.makeRedoChanges(this.lamport))
  }

  /**
   * @param {Array<import('./remote_change').RemoteChange> | null} changes
   */
  applyUndoAndRedo (changes) {
    if (changes) {
      let lastChange = null
      changes.forEach(change => {
        const localChange = this.convertRemoteToLocal(change)

        // Want to move the cursor to wherever text changed.
        if (localChange) {
          lastChange = localChange
        }

        this.editorSocket.sendChange(change, this.lamport)
      })

      if (lastChange) {
        if (lastChange.text === '') {
          // Deletion: cursor should go where the text used be
          this.codemirror.getDoc().setCursor(lastChange.from)
        } else {
          // Insertion: cursor should go at the end of the text
          this.codemirror.getDoc().setCursor({
            ch: lastChange.to.ch + 1,
            line: lastChange.to.line
          })
        }
      }
    }
  }

  /**
   * @param {import('./remote_change').RemoteChange} change
   * @returns {import('./local_change').LocalChange | null}
   */
  convertRemoteToLocal (change) {
    const localChange = updateAndConvertRemoteToLocal(this.crdt, change)
    if (localChange) {
      this.codemirror
        .getDoc()
        .replaceRange(localChange.text, localChange.from, localChange.to, IGNORE_REMOTE)
    }
    return localChange
  }

  /**
   * @param {import('./editor_socket').UserPresence} presence
   * @returns {RemoteCursor}
   */
  getCursorFor (presence) {
    let sites
    if (this.cursorWidgets.has(presence.userId)) {
      sites = this.cursorWidgets.get(presence.userId)
    } else {
      sites = new Map()
      this.cursorWidgets.set(presence.userId, sites)
    }

    let cursor
    if (sites.has(presence.siteId)) {
      cursor = sites.get(presence.siteId)
    } else {
      cursor = new RemoteCursor(presence.color, presence.userId, presence.siteId, this.codemirror)
      sites.set(presence.siteId, cursor)
    }

    return cursor
  }

  /**
   * @returns {Set<RemoteCursor>}
   */
  allCursors () {
    const cursors = new Set()
    this.cursorWidgets.forEach(sites => {
      sites.forEach(cursor => cursors.add(cursor))
    })
    return cursors
  }
}
