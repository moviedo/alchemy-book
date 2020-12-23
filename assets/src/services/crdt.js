import * as LocalChange from './local_change'
import * as RemoteChange from './remote_change'

/**
 * @typedef {{
 * init(init: Array<import('./char').Char.Serial>): undefined;
 * toString(): string;
 * remoteInsert(char: import('./char').Char): LocalChange.LocalChange | null;
 * remoteDelete(char: import('./char').Char): LocalChange.LocalChange | null;
 * localInsert(lamport: number, site: number, change: LocalChange.LocalChange): Array<import('./char').Char>;
 * localDelete(change: LocalChange.LocalChange): Array<import('./char').Char>;
 * }} Crdt
 *
 * @param {Crdt} crdt
 * @param {Number} lamport
 * @param {Number} site
 * @param {CodeMirror.EditorChange} change
 * @returns {Array<RemoteChange.RemoteChange>}
 */
export function updateAndConvertLocalToRemote (crdt, lamport, site, change) {
  if (
    change.from.line > change.to.line ||
    (change.from.line === change.to.line && change.from.ch > change.to.ch)
  ) {
    throw new Error('got inverted inverted from/to')
  }

  switch (change.origin) {
    case '+delete':
      return deleteCase()
    case '+input':
    case 'paste':
      return pasteInputCase()
    default:
      throw new Error('Unknown change origin ' + change.origin)
  }

  function deleteCase () {
    const deleteChange = LocalChange.create(change.from, change.to, '')
    return crdt.localDelete(deleteChange).map(RemoteChange.remove)
  }

  function pasteInputCase () {
    // Pure insertions have change.removed = [""]
    let removeChanges = []
    if (!(change.removed.length === 1 && change.removed[0] === '')) {
      const deletion = LocalChange.create(change.from, change.to, '')
      removeChanges = crdt.localDelete(deletion).map(RemoteChange.remove)
    }
    // All strings expect the last one represent the insertion of a new line
    const insert = LocalChange.create(change.from, change.to, change.text.join('\n'))
    const insertChanges = crdt.localInsert(lamport, site, insert).map(RemoteChange.add)
    return removeChanges.concat(insertChanges)
  }
}

/**
 * @param {Crdt} crdt
 * @param {RemoteChange.RemoteChange} change
 * @returns {LocalChange.LocalChange | null}
 */
export function updateAndConvertRemoteToLocal (crdt, change) {
  const char = change[1]
  switch (change[0]) {
    case 'add':
      return crdt.remoteInsert(char)
    case 'remove':
      return crdt.remoteDelete(char)
    default:
      throw new Error('unknown remote change')
    // default: const _exhaustiveCheck: never = "never";
  }
}
