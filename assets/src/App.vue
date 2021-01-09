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

html,
body {
  height: 100vh;
}

body {
  margin: 0;
  top: 0;
  color: ghostwhite;
  font-family: "Kingthings Trypewriter 2", sans-serif;
}

a {
  color: ghostwhite;
}

a:visited {
  color: ghostwhite;
}

a:hover {
  color: antiquewhite;
}

.header {
  background-image: url("../public/images/wood_header.png");
  top: 0;
  width: 100%;
  height: 67px;
  min-width: 500px;
}

.container {
  background-image: url("../public/images/blackboard.jpg");
  margin: 0;
  height: calc(100vh - 67px);
  width: 100%;
  display: flex;
  flex-direction: column;
}

.warning {
  padding: 20px 40px;
  text-align: center;
}

.code-container {
  padding: 20px 0;
  overflow-x: auto;
  overflow-y: auto;
  flex-grow: 1;
}

.intro {
  text-align: center;
  font-size: 1.5em;

  /* Center vertically */
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 50px;
  height: calc(100% - 100px);
}

.nav-left {
  margin-top: 15px;
  position: absolute;
  left: 0;
  padding: 0 20px;
  white-space: nowrap;
}

.nav-right {
  position: absolute;
  right: 0;
  top: 20px;
  padding: 0 20px;
}

.user {
  display: inline-block;
  vertical-align: middle;
}

.user * {
  display: inline-block;
  vertical-align: middle;
}

.username {
  margin: 0 10px;
}

.circle {
  border-radius: 50%;
  width: 30px;
  height: 30px;
}
</style>
