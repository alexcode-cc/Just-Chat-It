import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import App from './App.vue';
import routes from './router';

// Vuetify 樣式
import 'vuetify/styles';
import './styles/main.scss';

// Material Design Icons
import '@mdi/font/css/materialdesignicons.css';

// 創建 Vuetify 實例
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'liquidGlass',
    themes: {
      liquidGlass: {
        dark: false,
        colors: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#3B82F6',
          surface: 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(248, 250, 252, 0.8)',
        },
      },
    },
  },
});

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
