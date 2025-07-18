import "./assets/main.css";
import "@mdi/font/css/materialdesignicons.min.css";
import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Initialize authentication
const authStore = useAuthStore();
authStore.initAuth();

app.mount("#app");
