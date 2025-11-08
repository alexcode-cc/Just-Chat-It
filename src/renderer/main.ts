import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import routes from './router';

// Vuetify 樣式
import 'vuetify/styles';
import './styles/main.scss';

// Material Design Icons
import '@mdi/font/css/materialdesignicons.css';

// Vuetify 配置
import vuetify from './plugins/vuetify';

// 創建路由
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 創建 Pinia store
const pinia = createPinia();

// 創建 Vue 應用
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount('#app');
