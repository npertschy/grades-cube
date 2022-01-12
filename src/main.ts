import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { devtools } from '@vue/runtime-core'

import 'primevue/resources/themes/saga-blue/theme.css' //theme
import 'primevue/resources/primevue.min.css' //core css
import 'primeicons/primeicons.css' //icons

// import 'primeflex/src/_variables.scss';
// import 'primeflex/src/_grid.scss';
// import 'primeflex/src/_formlayout.scss';
// import 'primeflex/src/_display.scss';
// import 'primeflex/src/_text.scss';
// import 'primeflex/src/flexbox/_flexbox.scss';
// import 'primeflex/src/_spacing.scss';
// import 'primeflex/src/_elevation.scss';
import 'primeflex/primeflex.css';

const app = createApp(App)
app.use(PrimeVue)
app.mount('#app')
