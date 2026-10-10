import { reactive, computed } from 'vue'

// 角色与权限模型（mock 实现，联调后由 server 下发）
export type Role = 'admin' | 'operator' | 'viewer'

export type Permission =
  | 'control:emergency' // 紧急制动 / 人工接管
  | 'control:remote' // 远程遥控 / 姿态控制
  | 'task:dispatch' // 任务新建与下发
  | 'alarm:handle' // 告警确认与处置
  | 'device:ota' // 设备运维操作（重启/OTA/标定）
  | 'report:export' // 报告导出
  | 'system:manage' // 用户与权限管理

export interface RoleDef {
  role: Role
  name: string
  desc: string
  permissions: Permission[]
}

export const roles: RoleDef[] = [
  {
    role: 'admin',
    name: '系统管理员',
    desc: '拥有平台全部功能与系统管理权限',
    permissions: ['control:emergency', 'control:remote', 'task:dispatch', 'alarm:handle', 'device:ota', 'report:export', 'system:manage'],
  },
  {
    role: 'operator',
    name: '巡检调度员',
    desc: '任务调度、远程操控、告警处置与报告导出',
    permissions: ['control:emergency', 'control:remote', 'task:dispatch', 'alarm:handle', 'report:export'],
  },
  {
    role: 'viewer',
    name: '观察员',
    desc: '只读查看驾驶舱、监控、告警与报告',
    permissions: [],
  },
]

export interface User {
  id: string
  username: string
  displayName: string
  role: Role
  enabled: boolean
  lastLogin: string
}

// mock 账号库（密码仅本地演示，联调后删除）
export const mockAccounts = [
  { username: 'admin', password: 'admin123', displayName: '系统管理员', role: 'admin' as Role },
  { username: 'operator', password: 'op123456', displayName: '值班调度员', role: 'operator' as Role },
  { username: 'viewer', password: 'view1234', displayName: '园区参观席', role: 'viewer' as Role },
]

export const mockUsers: User[] = [
  { id: 'U-001', username: 'admin', displayName: '系统管理员', role: 'admin', enabled: true, lastLogin: '2026-10-10 08:32:11' },
  { id: 'U-002', username: 'operator', displayName: '值班调度员', role: 'operator', enabled: true, lastLogin: '2026-10-10 07:58:44' },
  { id: 'U-003', username: 'viewer', displayName: '园区参观席', role: 'viewer', enabled: true, lastLogin: '2026-10-09 16:20:03' },
  { id: 'U-004', username: 'inspector', displayName: '安全督查员', role: 'viewer', enabled: false, lastLogin: '2026-09-28 11:05:37' },
]

interface AuthState {
  token: string | null
  user: User | null
}

const STORAGE_KEY = 'rover-x1-auth'

function load(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AuthState
  } catch {
    /* ignore */
  }
  return { token: null, user: null }
}

const state = reactive<AuthState>(load())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }))
}

export function useAuth() {
  const isLoggedIn = computed(() => !!state.token && !!state.user)
  const roleDef = computed(() => roles.find((r) => r.role === state.user?.role))
  const permissions = computed<Permission[]>(() => roleDef.value?.permissions ?? [])

  function hasPermission(perm: Permission): boolean {
    return permissions.value.includes(perm)
  }

  async function login(username: string, password: string): Promise<void> {
    // mock 登录：联调后替换为 POST /api/auth/login
    await new Promise((r) => setTimeout(r, 400))
    const account = mockAccounts.find((a) => a.username === username && a.password === password)
    const user = mockUsers.find((u) => u.username === username)
    if (!account || !user) throw new Error('用户名或密码错误')
    if (!user.enabled) throw new Error('账号已被停用，请联系管理员')
    state.token = `mock-token-${username}-${Date.now()}`
    state.user = { ...user, lastLogin: new Date().toLocaleString('zh-CN', { hour12: false }) }
    persist()
  }

  function logout() {
    state.token = null
    state.user = null
    persist()
  }

  return { state, isLoggedIn, roleDef, permissions, hasPermission, login, logout }
}
