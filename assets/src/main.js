import 'phoenix_html'
import Vue from 'vue'
import App from './App.vue'
import store from './store'

window.onerror = function (msg, url, lineNo, columnNo, error) {
  fetch('/api/reporterror', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  })

  return false
}

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
