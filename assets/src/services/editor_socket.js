import { Presence, Socket } from 'phoenix'

// Needed for testing conflicts when you only have one keyboard
const artificialDelay = 0 * 1000

/**
 * @typedef {{
 *  color: String,
 *  cursor: Cursor,
 *  onlineAt: Number,
 *  siteId: Number,
 *  userId: Number,
 *  username: String
 * }} UserPresence
 *
 * Create new EditorSocket instance.
 * @class
 */
export default class EditorSocket {
  /**
   * Contructor
   *
   * @param {String} documentId
   * @param {Function} presenceCallback
   * @param {Function} disconnectCallback
   */
  constructor (documentId, presenceCallback, disconnectCallback) {
    this.documentId = documentId
    this.presenceCallback = presenceCallback
    this.disconnectCallback = disconnectCallback

    this.socket = new Socket('/socket', {
      // logger: (kind, msg, data) => {
      //   console.log(`${kind}: ${msg}`, data);
      // },
      params: { token: window.userToken }
    })
    this.presences = {}
  }

  /**
   * Setup socket connection to server.
   *
   * @param {Function} initCallback
   * @param {Function} changeCallback
   */
  connect (initCallback, changeCallback) {
    this.initCallback = initCallback
    this.changeCallback = changeCallback

    this.socket.connect()
    this.channel = this.socket.channel('documents:' + this.documentId)
    this.channel
      .join()
      .receive('ok', () => console.log('joined'))
      .receive('error', reason => console.log('join failed ', reason))
    this.channel.on('init', this.initCallback)
    this.channel.on('change', this.changeCallback)
    this.channel.on('presence_state', state => {
      this.presences = Presence.syncState(this.presences, state)
      this.presenceCallback(Presence.list(this.presences, this.listPresenceBy))
    })
    this.channel.on('presence_diff', diff => {
      this.presences = Presence.syncDiff(this.presences, diff)
      this.presenceCallback(Presence.list(this.presences, this.listPresenceBy))
    })

    this.channel.onClose(this.disconnectCallback)
    this.socket.onClose(this.disconnectCallback)
  }

  /**
   * Send change and lamport info to server.
   *
   * @param {*} change
   * @param {Number} lamport
   */
  sendChange (change, lamport) {
    setTimeout(() => {
      this.channel.push('change', { change, lamport }).receive('error', e => {
        throw e
      })
    }, artificialDelay)
  }

  /**
   * Send cursor info to server.
   *
   * @param {Cursor} cursor
   */
  sendCursor (cursor) {
    setTimeout(() => {
      this.channel.push('cursor', cursor).receive('error', e => {
        throw e
      })
    }, artificialDelay)
  }

  /**
   * Return UserPresence from given parameters.
   *
   * @typedef {{
   *  line: Number,
   *  ch: Number
   * }} Cursor
   *
   * @param {String} siteId
   * @param {Object} param1
   * @return {UserPresence}
   */
  listPresenceBy (siteId, { metas }) {
    return {
      color: metas[0].color,
      cursor: metas[0].cursor,
      onlineAt: metas[0].online_at,
      siteId: parseInt(siteId, 10),
      userId: metas[0].user_id,
      username: metas[0].username
    }
  }
}
