import { createApp } from 'vue'
import 'amfe-flexible'

import App from './App.vue'
import router from './router'

// When an old browser tab survives a deployment, force one clean reload if Vite
// detects that a previously referenced build asset no longer exists.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const reloadUrl = new URL(window.location.href)
  reloadUrl.searchParams.set('_app_reload', Date.now().toString())
  window.location.replace(reloadUrl)
})

const app = createApp(App)

app.use(router)

app.mount('#app')
