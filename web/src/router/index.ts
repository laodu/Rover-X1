import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, type Permission } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', public: true } },
    { path: '/', redirect: '/dashboard' },
    {
      path: '/',
      component: () => import('../layout/AppLayout.vue'),
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '总览驾驶舱' } },
        { path: 'monitor', name: 'monitor', component: () => import('../views/MonitorView.vue'), meta: { title: '实时监控' } },
        { path: 'tasks', name: 'tasks', component: () => import('../views/TasksView.vue'), meta: { title: '巡检任务', permission: 'task:dispatch' } },
        { path: 'alarms', name: 'alarms', component: () => import('../views/AlarmsView.vue'), meta: { title: '告警中心' } },
        { path: 'devices', name: 'devices', component: () => import('../views/DevicesView.vue'), meta: { title: '设备管理' } },
        { path: 'reports', name: 'reports', component: () => import('../views/ReportsView.vue'), meta: { title: '巡检报告' } },
        { path: 'system', name: 'system', component: () => import('../views/SystemView.vue'), meta: { title: '系统管理', permission: 'system:manage' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 路由守卫：未登录跳登录页；无权限跳回驾驶舱
router.beforeEach((to) => {
  const { isLoggedIn, hasPermission } = useAuth()

  if (to.meta.public) {
    return isLoggedIn.value ? { path: '/dashboard' } : true
  }
  if (!isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  const perm = to.meta.permission as Permission | undefined
  if (perm && !hasPermission(perm)) {
    return { path: '/dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = `Rover X1 智能巡检管控平台 - ${(to.meta.title as string) ?? ''}`
})

export default router
