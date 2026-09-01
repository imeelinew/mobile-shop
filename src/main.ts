import { createApp } from 'vue'
import 'amfe-flexible'

import App from './App.vue'
import router from './router'
import { setupDeploymentRecovery } from '@/utils/deploymentRecovery'

setupDeploymentRecovery(router)

const app = createApp(App)

app.use(router)

app.mount('#app')
