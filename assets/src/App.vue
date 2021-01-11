<template>
  <Collaborator></Collaborator>
</template>

<script>
import Collaborator from './components/Collaborator.vue'

export default {
  name: 'App',
  components: {
    Collaborator
  }
}
</script>

<style lang="scss">
/* This file is for your main application css. */
@import "~codemirror/lib/codemirror.css";
@import "../public/css/zenburn.css";

@font-face {
  font-family: "Kingthings Trypewriter 2";
  src: url("../public/fonts/kingthings-trypewriter-2.ttf") format("truetype");
}

.CodeMirror {
  height: 100%;
  font-family: "Kingthings Trypewriter 2", sans-serif;
  font-size: 1.5em;
  background-color: transparent;
  float: left;
}

.CodeMirror-linenumber {
  padding-left: 10px;
  padding-right: 25px;
}

/* Thicker cursor */
.cm-s-zenburn {
  color: ghostwhite;
}

.cm-s-zenburn .CodeMirror-cursor {
  border-left: 2.5px solid white;
}

.cm-s-zenburn .CodeMirror-gutters {
  background-color: transparent !important;
  border: none;
}
</style>
