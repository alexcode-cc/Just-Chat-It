import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/components/dashboard/MainDashboard.vue'),
  },
  {
    path: '/chat/:serviceId',
    name: 'Chat',
    component: () => import('@/components/chat/ChatWindow.vue'),
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/components/compare/CompareWindow.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/components/settings/SettingsPanel.vue'),
  },
  {
    path: '/prompts',
    name: 'Prompts',
    component: () => import('@/components/prompts/PromptLibrary.vue'),
  },
  {
    path: '/quota',
    name: 'Quota',
    component: () => import('@/components/quota/QuotaManager.vue'),
  },
];

export default routes;
