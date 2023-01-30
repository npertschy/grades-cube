import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'

import router from './router'

import 'primevue/resources/themes/saga-blue/theme.css' //theme
import 'primevue/resources/primevue.min.css' //core css
import 'primeicons/primeicons.css' //icons

import '/node_modules/primeflex/primeflex.css'

import Tooltip from 'primevue/tooltip'

const app = createApp(App)
app.use(router)
app.use(PrimeVue)
app.directive('tooltip', Tooltip)
app.mount('#app')
