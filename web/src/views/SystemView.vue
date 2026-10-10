<script setup lang="ts">
import { computed, ref } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatusBadge from '../components/StatusBadge.vue'
import {
  roles,
  mockUsers,
  useAuth,
  type Permission,
  type Role,
  type User,
} from '../stores/auth'

const { state } = useAuth()

const permissionLabels: { perm: Permission; label: string }[] = [
  { perm: 'control:emergency', label: '紧急制动 / 人工接管' },
  { perm: 'control:remote', label: '远程遥控 / 姿态控制' },
  { perm: 'task:dispatch', label: '任务新建与下发' },
  { perm: 'alarm:handle', label: '告警确认与处置' },
  { perm: 'device:ota', label: '设备运维（重启 / OTA / 标定）' },
  { perm: 'report:export', label: '巡检报告导出' },
  { perm: 'system:manage', label: '用户与权限管理' },
]

const users = ref<User[]>(mockUsers.map((u) => ({ ...u })))
const editing = ref<User | null>(null)
const showForm = ref(false)
const isNew = ref(false)

const roleName = (r: Role) => roles.find((x) => x.role === r)?.name ?? r
const roleTone = (r: Role) => (r === 'admin' ? 'danger' : r === 'operator' ? 'active' : 'muted') as 'danger' | 'active' | 'muted'

function openCreate() {
  isNew.value = true
  editing.value = { id: `U-${String(users.value.length + 1).padStart(3, '0')}`, username: '', displayName: '', role: 'viewer', enabled: true, lastLogin: '—' }
  showForm.value = true
}

function openEdit(u: User) {
  isNew.value = false
  editing.value = { ...u }
  showForm.value = true
}

function save() {
  if (!editing.value) return
  if (isNew.value) {
    users.value.push({ ...editing.value })
  } else {
    const i = users.value.findIndex((u) => u.id === editing.value!.id)
    if (i >= 0) users.value[i] = { ...editing.value }
  }
  console.log('[system] 保存用户', editing.value)
  showForm.value = false
}

function toggleEnabled(u: User) {
  if (u.username === state.user?.username) return // 不能停用自己
  u.enabled = !u.enabled
  console.log('[system] 切换账号状态', u.username, u.enabled)
}

const enabledCount = computed(() => users.value.filter((u) => u.enabled).length)
</script>

<template>
  <div class="space-y-4">
    <!-- 顶部统计 -->
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div class="stream-line border border-info/15 bg-panel/70 px-3 py-2.5">
        <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">注册账号</div>
        <div class="mt-1 font-mono text-2xl font-bold text-primary glow-text">{{ users.length }} <span class="text-[10px] text-text-low">个</span></div>
      </div>
      <div class="stream-line border border-info/15 bg-panel/70 px-3 py-2.5">
        <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">启用账号</div>
        <div class="mt-1 font-mono text-2xl font-bold text-success">{{ enabledCount }} <span class="text-[10px] text-text-low">个</span></div>
      </div>
      <div class="stream-line border border-info/15 bg-panel/70 px-3 py-2.5">
        <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">角色定义</div>
        <div class="mt-1 font-mono text-2xl font-bold text-primary">{{ roles.length }} <span class="text-[10px] text-text-low">类</span></div>
      </div>
      <div class="stream-line border border-info/15 bg-panel/70 px-3 py-2.5">
        <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">权限点</div>
        <div class="mt-1 font-mono text-2xl font-bold text-warning">{{ permissionLabels.length }} <span class="text-[10px] text-text-low">项</span></div>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <!-- 用户管理 -->
      <HudPanel index="SEC.01" title="用户管理" status="online">
        <template #actions>
          <button
            class="border border-primary bg-gradient-to-br from-primary/20 to-primary-dim/40 px-3 py-1 text-xs font-semibold text-white hover:shadow-[0_0_12px_rgba(0,242,254,0.3)]"
            @click="openCreate"
          >
            + 新建用户
          </button>
        </template>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-text-low">
              <th class="py-2 pr-2">账号</th>
              <th class="py-2 pr-2">姓名</th>
              <th class="py-2 pr-2">角色</th>
              <th class="py-2 pr-2">最近登录</th>
              <th class="py-2 pr-2">状态</th>
              <th class="py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-line/60 transition-colors hover:bg-primary/5">
              <td class="py-2.5 pr-2 font-mono text-xs text-primary">{{ u.username }}</td>
              <td class="py-2.5 pr-2 text-xs">{{ u.displayName }}</td>
              <td class="py-2.5 pr-2"><StatusBadge :text="roleName(u.role)" :tone="roleTone(u.role)" /></td>
              <td class="py-2.5 pr-2 font-mono text-[11px] text-text-mid">{{ u.lastLogin }}</td>
              <td class="py-2.5 pr-2">
                <StatusBadge :text="u.enabled ? '启用' : '停用'" :tone="u.enabled ? 'online' : 'muted'" />
              </td>
              <td class="py-2.5 text-right text-xs">
                <button class="mr-2 text-info hover:text-primary" @click="openEdit(u)">编辑</button>
                <button
                  :class="u.username === state.user?.username ? 'cursor-not-allowed text-text-low' : u.enabled ? 'text-warning hover:text-danger' : 'text-success'"
                  :disabled="u.username === state.user?.username"
                  @click="toggleEnabled(u)"
                >
                  {{ u.enabled ? '停用' : '启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </HudPanel>

      <!-- 角色权限矩阵 -->
      <HudPanel index="SEC.02" title="角色权限矩阵" status="online">
        <template #actions>
          <span class="font-mono text-[10px] text-text-low">RBAC // 3 角色 × {{ permissionLabels.length }} 权限点</span>
        </template>

        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-text-low">
              <th class="py-2 pr-2">权限点</th>
              <th v-for="r in roles" :key="r.role" class="py-2 text-center">{{ r.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in permissionLabels" :key="p.perm" class="border-b border-line/60">
              <td class="py-2.5 pr-2">
                <div class="text-xs">{{ p.label }}</div>
                <div class="font-mono text-[10px] text-text-low">{{ p.perm }}</div>
              </td>
              <td v-for="r in roles" :key="r.role" class="py-2.5 text-center">
                <span
                  class="inline-block h-3 w-3 border"
                  :class="
                    r.permissions.includes(p.perm)
                      ? 'border-success bg-success/30 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                      : 'border-line bg-container'
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-3 space-y-1.5 border-t border-line pt-3">
          <div v-for="r in roles" :key="r.role" class="flex items-start gap-2 text-xs">
            <StatusBadge :text="r.name" :tone="roleTone(r.role)" />
            <span class="text-text-mid">{{ r.desc }}</span>
          </div>
        </div>
      </HudPanel>
    </div>

    <!-- 用户编辑弹窗 -->
    <div v-if="showForm && editing" class="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm" @click.self="showForm = false">
      <div class="stream-line w-full max-w-sm border border-primary/40 bg-panel p-5 shadow-[0_0_40px_rgba(0,242,254,0.15)]">
        <h3 class="mb-4 font-headline text-sm font-semibold">{{ isNew ? '新建用户' : '编辑用户' }}</h3>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-text-mid">账号</label>
            <input
              v-model="editing.username"
              :disabled="!isNew"
              class="w-full border border-line-strong bg-container/80 px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:opacity-50"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-text-mid">姓名</label>
            <input v-model="editing.displayName" class="w-full border border-line-strong bg-container/80 px-3 py-2 text-sm outline-none focus:border-primary/60" />
          </div>
          <div>
            <label class="mb-1 block text-xs text-text-mid">角色</label>
            <select v-model="editing.role" class="w-full border border-line-strong bg-container/80 px-3 py-2 text-sm outline-none focus:border-primary/60">
              <option v-for="r in roles" :key="r.role" :value="r.role">{{ r.name }}</option>
            </select>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button class="border border-line-strong bg-container/60 px-4 py-1.5 text-xs text-text-mid hover:text-text-hi" @click="showForm = false">取消</button>
          <button class="border border-primary bg-gradient-to-br from-primary/20 to-primary-dim/40 px-4 py-1.5 text-xs font-semibold text-white" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
