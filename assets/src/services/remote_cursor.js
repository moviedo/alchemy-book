/**
 * Create a RemoteCursor instance.
 */
export default class RemoteCursor {
  /**
   * @param {String} color
   * @param {Number} userId
   * @param {Number} siteId
   * @param {CodeMirror.Editor} codemirror
   */
  constructor (color, userId, siteId, codemirror) {
    /**
     * @property {Number}
     */
    this.userId = userId
    /**
     * @property {Number}
     */
    this.siteId = siteId
    /**
     * @property {CodeMirror.Editor}
     */
    this.codemirror = codemirror
    /**
     * @property {HTMLElement}
     */
    this.widget = document.createElement('div')
    this.widget.style.position = 'absolute'
    this.widget.style.width = '3px'
    const lineHeight = this.codemirror.defaultTextHeight()
    this.widget.style.height = `${lineHeight}px`
    this.widget.style.backgroundColor = color
    this.widget.style.top = '0px'
  }

  /**
   * Move cursor to given position.
   *
   * @param {import('codemirror').Position} pos
   */
  moveTo (pos) {
    // Reinsert the cursor every time to move it.
    this.detach()

    if (pos) {
      const coords = this.codemirror.cursorCoords(pos, 'local')
      this.widget.style.left = `${coords.left}px`
      this.codemirror.getDoc().setBookmark(pos, { widget: this.widget })
    }
  }

  /**
   * Remove widget from screen.
   */
  detach () {
    if (this.widget.parentElement) {
      this.widget.parentElement.removeChild(this.widget)
    }
  }
}
