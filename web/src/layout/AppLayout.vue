<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth, type Permission } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { state, roleDef, hasPermission, logout } = useAuth()

interface NavItem {
  name: string
  label: string
  to: string
  permission?: Permission
}

const allNavItems: NavItem[] = [
  { name: 'dashboard', label: '总览驾驶舱', to: '/dashboard' },
  { name: 'monitor', label: '实时监控', to: '/monitor' },
  { name: 'tasks', label: '巡检任务', to: '/tasks', permission: 'task:dispatch' },
  { name: 'alarms', label: '告警中心', to: '/alarms' },
  { name: 'devices', label: '设备管理', to: '/devices' },
  { name: 'reports', label: '巡检报告', to: '/reports' },
  { name: 'system', label: '系统管理', to: '/system', permission: 'system:manage' },
]

// 菜单级权限：无权限的入口不渲染
const navItems = computed(() => allNavItems.filter((i) => !i.permission || hasPermission(i.permission)))

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => clearInterval(timer))

const clock = computed(() =>
  now.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
)

const userMenuOpen = ref(false)
const initial = computed(() => state.user?.displayName?.slice(0, 1) ?? '?')

function onLogout() {
  userMenuOpen.value = false
  logout()
  router.replace('/login')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 顶部导航栏 -->
    <header class="relative z-50 flex h-14 shrink-0 items-center gap-6 border-b border-line bg-panel/80 px-5 backdrop-blur-md">
      <!-- 品牌 -->
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center border border-primary/60 bg-primary/10">
          <span class="font-headline text-sm font-bold text-primary glow-text">R</span>
        </div>
        <div class="leading-tight">
          <div class="font-headline text-sm font-bold tracking-wide">Rover X1 智能巡检管控平台</div>
          <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">Quadruped Patrol Command</div>
        </div>
      </div>

      <!-- 导航 -->
      <nav class="flex h-full items-center gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="relative flex h-full items-center px-3.5 text-sm transition-colors"
          :class="
            route.name === item.name
              ? 'text-primary glow-text'
              : 'text-text-mid hover:text-text-hi'
          "
        >
          {{ item.label }}
          <span
            v-if="route.name === item.name"
            class="absolute inset-x-2 bottom-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(0,242,254,0.8)]"
          />
        </router-link>
      </nav>

      <div class="flex-1" />

      <!-- 右侧状态区 -->
      <div class="flex items-center gap-4 font-mono text-xs text-text-mid">
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          5G 专网 12ms
        </span>
        <span>{{ clock }}</span>
        <button
          v-permission="'control:emergency'"
          class="pulse-danger border border-danger bg-danger/25 px-3 py-1.5 font-body text-xs font-semibold text-white"
        >
          紧急制动
        </button>

        <!-- 用户菜单 -->
        <div class="relative">
          <button
            class="flex items-center gap-2 border border-line-strong bg-elevated py-1 pl-1 pr-2.5 transition-colors hover:border-primary/50"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="flex h-6 w-6 items-center justify-center bg-primary/15 text-xs font-semibold text-primary">{{ initial }}</span>
            <span class="font-body text-xs text-text-hi">{{ state.user?.displayName }}</span>
            <span class="text-[9px] text-text-low">▼</span>
          </button>

          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full z-50 mt-1.5 w-52 border border-line-strong bg-panel shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            @click.stop
          >
            <div class="border-b border-line px-3.5 py-3">
              <div class="font-body text-sm text-text-hi">{{ state.user?.displayName }}</div>
              <div class="mt-0.5 font-mono text-[10px] text-text-low">@{{ state.user?.username }}</div>
              <div class="mt-1.5">
                <span class="inline-flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                  <span class="h-1 w-1 rounded-full bg-primary" />
                  {{ roleDef?.name }}
                </span>
              </div>
            </div>
            <button
              class="w-full px-3.5 py-2.5 text-left font-body text-xs text-danger transition-colors hover:bg-danger/10"
              @click="onLogout"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 点击空白关闭用户菜单 -->
    <div v-if="userMenuOpen" class="fixed inset-0 z-40" @click="userMenuOpen = false" />

    <!-- 页面主体 -->
    <main class="min-h-0 flex-1 overflow-auto p-4">
      <router-view />
    </main>
  </div>
</template>
