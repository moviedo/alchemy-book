<template>
  <div className="page">
    <header className="header">
      <div className="nav-left indicators">
        <div className="user" v-for="presence in presences" :key="presence.userId">
          <div className="circle" :style="{ background: presence.color }"></div>
          <div className="username">{{ presence.username }}</div>
        </div>
      </div>

      <div className="nav-right">
        <a href="/">back to main</a>
      </div>
    </header>

    <div className="container">
      <div v-if="disconnected" className="warning">
        <p>Disconnected due to connection error - please refresh</p>
      </div>

      <div v-if="exceededLimit" className="warning">
        <p>Operation cancelled: Exceeded the 2500 character limit of this document</p>
        <p>
          I know you'd like to stress test this application but my server is pretty small! Please
          run tests on your own machine instead and let me know what you find!
        </p>
      </div>

      <div className="code-container">
        <textarea ref="editor-root"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
import Editor from '../services/editor'
import EditorSocket from '../services/editor_socket'

export default {
  data () {
    return {
      presences: [],
      exceededLimit: false,
      disconnected: false,
      editor: Editor
    }
  },

  methods: {
    presenceCallback (presences) {
      this.presences = presences
      this.editor.updateCursors(presences)
    },

    disconnectCallback () {
      this.disconnected = true
    },

    limitCallback (exceeded) {
      this.exceededLimit = exceeded
    }
  },

  mounted () {
    const url = window.location.pathname
    const documentId = url.substring(url.lastIndexOf('/') + 1)
    const editorSocket = new EditorSocket(
      documentId,
      this.presenceCallback,
      this.disconnectCallback
    )
    const textarea = this.$refs['editor-root']
    this.editor = new Editor(textarea, editorSocket, this.limitCallback)
  }
}
</script>
