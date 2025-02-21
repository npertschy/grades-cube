import "primeicons/primeicons.css";
import "@/assets/styles.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Ripple from "primevue/ripple";
import KeyFilter from "primevue/keyfilter";
import { config } from "@/PrimeVueConfig";

const app = createApp(App);

app.use(router);
app.use(PrimeVue, config);
app.directive("ripple", Ripple);
app.directive("keyfilter", KeyFilter);

app.mount("#app");
