import "primevue/resources/themes/aura-light-green/theme.css";
import "primeicons/primeicons.css";
import "/node_modules/primeflex/primeflex.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Ripple from "primevue/ripple";

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
  ripple: true,
});
app.directive("ripple", Ripple);

app.mount("#app");
