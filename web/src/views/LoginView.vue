<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth, mockAccounts, roles } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await login(username.value.trim(), password.value)
    router.replace((route.query.redirect as string) || '/dashboard')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function fill(u: string, p: string) {
  username.value = u
  password.value = p
  error.value = ''
}

const roleName = (r: string) => roles.find((x) => x.role === r)?.name ?? r
</script>

<template>
  <div class="flex h-full items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- 品牌 -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-primary/60 bg-primary/10">
          <span class="font-headline text-2xl font-bold text-primary glow-text">R</span>
        </div>
        <h1 class="font-headline text-xl font-bold tracking-wide">Rover X1 智能巡检管控平台</h1>
        <p class="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-text-low">Quadruped Patrol Command</p>
      </div>

      <!-- 登录面板 -->
      <div class="stream-line relative border border-info/15 bg-panel/70 p-6 backdrop-blur-md">
        <span class="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-primary/60" />
        <span class="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-primary/60" />
        <span class="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-primary/60" />
        <span class="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-primary/60" />

        <div class="mb-5 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          <span class="font-mono text-[10px] uppercase tracking-widest text-text-low">AUTH.01 // 身份认证</span>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label class="mb-1.5 block text-xs text-text-mid">用户名</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              class="w-full border border-line-strong bg-container/80 px-3 py-2.5 text-sm text-text-hi placeholder-text-low outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_12px_rgba(0,242,254,0.15)]"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs text-text-mid">密码</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              class="w-full border border-line-strong bg-container/80 px-3 py-2.5 text-sm text-text-hi placeholder-text-low outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_12px_rgba(0,242,254,0.15)]"
            />
          </div>

          <p v-if="error" class="border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full border border-primary bg-gradient-to-br from-primary/20 to-primary-dim/40 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-50"
          >
            {{ loading ? '认证中…' : '登 录' }}
          </button>
        </form>
      </div>

      <!-- 演示账号 -->
      <div class="mt-4 border border-line bg-panel/50 p-4">
        <div class="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-low">DEMO // 演示账号（点击填充）</div>
        <div class="space-y-1.5">
          <button
            v-for="acc in mockAccounts"
            :key="acc.username"
            type="button"
            class="flex w-full items-center justify-between border border-line bg-container/50 px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/40"
            @click="fill(acc.username, acc.password)"
          >
            <span class="font-mono text-primary">{{ acc.username }}</span>
            <span class="text-text-mid">{{ roleName(acc.role) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
