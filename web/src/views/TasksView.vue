<script setup lang="ts">
import { computed, ref } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { robots, tasks, type AlarmType, type PatrolTask, type TaskState } from '../mock/data'

type BadgeTone = 'online' | 'active' | 'hazard' | 'danger' | 'muted'

const stateTone: Record<TaskState, BadgeTone> = {
  进行中: 'active',
  待执行: 'muted',
  已完成: 'online',
  异常: 'danger',
}

const stateBarColor: Record<TaskState, string> = {
  进行中: 'bg-primary shadow-[0_0_8px_rgba(0,242,254,0.7)]',
  待执行: 'bg-line-strong',
  已完成: 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  异常: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.7)]',
}

const stateEdgeColor: Record<TaskState, string> = {
  进行中: 'border-l-primary',
  待执行: 'border-l-line-strong',
  已完成: 'border-l-success',
  异常: 'border-l-danger',
}

/* ---------- 左栏：搜索 / 筛选 / 列表 ---------- */
const keyword = ref('')
const filters = ['全部', '进行中', '待执行', '已完成', '异常'] as const
type Filter = (typeof filters)[number]
const activeFilter = ref<Filter>('全部')

const countOf = (f: Filter) => (f === '全部' ? tasks.length : tasks.filter((t) => t.state === f).length)

const filteredTasks = computed(() =>
  tasks.filter((t) => {
    const matchState = activeFilter.value === '全部' || t.state === activeFilter.value
    const kw = keyword.value.trim()
    const matchKw = !kw || t.name.includes(kw) || t.robot.includes(kw) || t.id.toLowerCase().includes(kw.toLowerCase())
    return matchState && matchKw
  }),
)

/* ---------- 右栏：巡检路线地图 ---------- */
interface MapPoint {
  name: string
  x: number
  y: number
  tone: 'primary' | 'success' | 'danger' | 'warning'
}

const mapPoints: MapPoint[] = [
  { name: '配电房', x: 22, y: 30, tone: 'primary' },
  { name: '垃圾站', x: 42, y: 62, tone: 'success' },
  { name: '围墙周界', x: 68, y: 24, tone: 'danger' },
  { name: '管廊入口', x: 84, y: 62, tone: 'warning' },
]

const pointColor: Record<MapPoint['tone'], { dot: string; text: string; border: string }> = {
  primary: { dot: 'text-primary border-primary shadow-[0_0_12px_rgba(0,242,254,0.6)]', text: 'text-primary border-primary/40', border: '#00f2fe' },
  success: { dot: 'text-success border-success shadow-[0_0_12px_rgba(16,185,129,0.6)]', text: 'text-success border-success/40', border: '#10b981' },
  danger: { dot: 'text-danger border-danger shadow-[0_0_12px_rgba(239,68,68,0.6)]', text: 'text-danger border-danger/40', border: '#ef4444' },
  warning: { dot: 'text-warning border-warning shadow-[0_0_12px_rgba(245,158,11,0.6)]', text: 'text-warning border-warning/40', border: '#f59e0b' },
}

const polylinePoints = computed(() => mapPoints.map((p) => `${p.x},${p.y}`).join(' '))

const snapEnabled = ref(true)
const activeTool = ref<'图层' | '吸附' | '全屏' | ''>('吸附')

function toggleTool(tool: '图层' | '吸附' | '全屏') {
  activeTool.value = activeTool.value === tool ? '' : tool
  if (tool === '吸附') snapEnabled.value = !snapEnabled.value
}

/* ---------- 右栏：任务配置表单 ---------- */
const aiOptions: AlarmType[] = ['烟火识别', '人员越界', '垃圾满溢', '设备过温', '气体异常']

const defaultPoints = ['配电房东门', '变压器 T1', '变压器 T2', '开关柜组']

const form = ref({
  name: '',
  robot: robots[0].name,
  mode: '定时' as '定时' | '周期' | '手动触发',
  points: [...defaultPoints],
  aiItems: ['烟火识别', '设备过温'] as AlarmType[],
})

const activeTaskId = ref<string>('')

function loadTask(t: PatrolTask) {
  activeTaskId.value = t.id
  form.value = {
    name: t.name,
    robot: t.robot,
    mode: '定时',
    points: [...t.points],
    aiItems: t.aiItems.filter((a) => aiOptions.includes(a)),
  }
}

function newTask() {
  activeTaskId.value = ''
  resetForm()
  console.log('[TasksView] 新建任务')
}

function resetForm() {
  form.value = {
    name: '',
    robot: robots[0].name,
    mode: '定时',
    points: [...defaultPoints],
    aiItems: ['烟火识别'],
  }
}

function toggleAiItem(item: AlarmType) {
  const idx = form.value.aiItems.indexOf(item)
  if (idx >= 0) form.value.aiItems.splice(idx, 1)
  else form.value.aiItems.push(item)
}

function onCancel() {
  activeTaskId.value = ''
  resetForm()
  console.log('[TasksView] 取消编辑')
}

function onSubmit() {
  console.log('[TasksView] 保存并下发任务:', JSON.parse(JSON.stringify(form.value)))
}
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row">
    <!-- ================= 左栏：任务列表 ================= -->
    <section class="flex w-full flex-col gap-3 lg:w-[38%]">
      <!-- 搜索 + 新建任务 -->
      <div class="stream-line relative flex items-center gap-3 border border-info/15 bg-panel/70 p-3 backdrop-blur-md">
        <span class="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-primary/60" />
        <span class="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-primary/60" />
        <div class="relative flex-1">
          <svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" stroke-linecap="round" />
          </svg>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索巡检任务、机器狗编号..."
            class="w-full border border-line bg-container py-1.5 pl-8 pr-3 text-sm text-text-hi placeholder:text-text-low focus:border-primary/60 focus:outline-none"
          />
        </div>
        <button
          v-permission="'task:dispatch'"
          class="flex shrink-0 items-center gap-1.5 border border-primary bg-gradient-to-br from-primary/20 to-primary-dim/40 px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(0,242,254,0.25)] transition-all [text-shadow:0_0_8px_rgba(0,242,254,0.6)] hover:from-primary/30 hover:to-primary-dim/60 hover:shadow-[0_0_18px_rgba(0,242,254,0.45)]"
          @click="newTask"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建任务
        </button>
      </div>

      <!-- 状态筛选标签 -->
      <div class="flex items-center gap-2 overflow-x-auto pb-0.5">
        <button
          v-for="f in filters"
          :key="f"
          class="whitespace-nowrap border px-3 py-1 font-mono text-[11px] tracking-wide transition-colors"
          :class="
            activeFilter === f
              ? 'border-primary/70 bg-primary/15 text-primary shadow-[0_0_10px_rgba(0,242,254,0.2)]'
              : 'border-line bg-container text-text-mid hover:border-line-strong hover:text-text-hi'
          "
          @click="activeFilter = f"
        >
          {{ f }} <span class="text-[10px] opacity-80">({{ countOf(f) }})</span>
        </button>
      </div>

      <!-- 任务卡片列表 -->
      <div class="flex max-h-[calc(100vh-220px)] flex-col gap-3 overflow-y-auto pr-1">
        <div
          v-for="t in filteredTasks"
          :key="t.id"
          class="group relative cursor-pointer border border-l-4 bg-panel/70 p-3 backdrop-blur-md transition-all"
          :class="[
            stateEdgeColor[t.state],
            activeTaskId === t.id ? 'border-info/50 shadow-[0_0_16px_rgba(0,242,254,0.12)]' : 'border-info/15 hover:border-info/40',
          ]"
          @click="loadTask(t)"
        >
          <div class="mb-1.5 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-text-low">[{{ t.id }} // 自动巡检]</span>
              <h3 class="truncate text-sm font-semibold text-text-hi">{{ t.name }}</h3>
            </div>
            <StatusBadge :text="t.state" :tone="stateTone[t.state]" class="shrink-0" />
          </div>

          <div class="mb-2.5 flex items-center justify-between text-xs text-text-mid">
            <span class="flex items-center gap-1">
              <svg class="h-3.5 w-3.5 text-text-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="2" />
                <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke-linecap="round" />
              </svg>
              {{ t.robot }}
            </span>
            <span class="flex items-center gap-1 font-mono">
              <svg class="h-3.5 w-3.5 text-text-low" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" stroke-linecap="round" />
              </svg>
              {{ t.schedule }}
            </span>
          </div>

          <div class="mb-1.5 h-1.5 w-full overflow-hidden bg-container">
            <div class="h-full transition-all" :class="stateBarColor[t.state]" :style="{ width: t.progress + '%' }" />
          </div>

          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] tracking-wide" :class="t.state === '异常' ? 'text-danger' : 'text-text-low'">
              进度 <span :class="t.state === '异常' ? 'text-danger' : 'text-text-mid'">{{ t.progress }}%</span>
              · {{ t.points.length }} 点位
            </span>
            <div class="flex flex-wrap justify-end gap-1">
              <span
                v-for="ai in t.aiItems"
                :key="ai"
                class="border border-teal/30 bg-teal/10 px-1.5 py-px font-mono text-[10px] text-teal"
              >
                {{ ai }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="filteredTasks.length === 0" class="border border-dashed border-line bg-panel/40 py-10 text-center font-mono text-xs text-text-low">
          // 无匹配任务
        </div>
      </div>
    </section>

    <!-- ================= 右栏：路线编辑 + 任务配置 ================= -->
    <section class="flex w-full flex-col gap-4 lg:w-[62%]">
      <!-- 巡检路线编辑 -->
      <HudPanel index="GEO.MAP" title="巡检路线编辑" status="online">
        <template #actions>
          <div class="flex items-center gap-1 border border-line bg-container p-0.5">
            <button
              v-for="tool in ['图层', '吸附', '全屏'] as const"
              :key="tool"
              class="px-2 py-1 font-mono text-[10px] tracking-wide transition-colors"
              :class="activeTool === tool ? 'bg-primary/15 text-primary' : 'text-text-mid hover:text-text-hi'"
              @click="toggleTool(tool)"
            >
              {{ tool }}
            </button>
          </div>
        </template>

        <!-- 地图容器 -->
        <div class="relative h-[320px] overflow-hidden border border-line/60 bg-canvas">
          <!-- 网格 -->
          <div
            class="absolute inset-0 opacity-40"
            style="
              background-image: linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
              background-size: 24px 24px;
            "
          />
          <!-- 发光路线 -->
          <svg class="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              :points="polylinePoints"
              fill="none"
              stroke="#00f2fe"
              stroke-width="0.8"
              stroke-dasharray="2 1.2"
              stroke-linejoin="round"
              opacity="0.35"
            />
            <polyline
              :points="polylinePoints"
              fill="none"
              stroke="#00f2fe"
              stroke-width="0.35"
              stroke-linejoin="round"
              style="filter: drop-shadow(0 0 2px rgba(0, 242, 254, 0.9))"
            />
          </svg>

          <!-- 点位标记 -->
          <div
            v-for="(p, i) in mapPoints"
            :key="p.name"
            class="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center"
            :style="{ left: p.x + '%', top: p.y + '%' }"
          >
            <span
              v-if="i === 0"
              class="absolute h-6 w-6 animate-ping rounded-full border-2"
              :style="{ borderColor: pointColor[p.tone].border, opacity: 0.5 }"
            />
            <span
              class="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-elevated font-mono text-[10px] font-bold"
              :class="pointColor[p.tone].dot"
            >
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span class="mt-1 whitespace-nowrap border bg-canvas/90 px-1.5 py-px font-mono text-[10px]" :class="pointColor[p.tone].text">
              {{ p.name }}
            </span>
          </div>

          <!-- 状态浮窗 -->
          <div class="absolute bottom-2 left-2 flex items-center gap-3 border border-line bg-panel/90 px-2.5 py-1 font-mono text-[10px] text-text-mid backdrop-blur">
            <span>坐标系: WGS84_UTM</span>
            <span :class="snapEnabled ? 'text-primary' : 'text-text-low'">点位吸附: {{ snapEnabled ? '已开启' : '已关闭' }}</span>
            <span class="text-success">总路径长度: 1.42 km</span>
          </div>
        </div>
      </HudPanel>

      <!-- 任务配置 -->
      <HudPanel index="CFG.TASK" title="任务配置" status="none">
        <div class="flex flex-col gap-4">
          <!-- 第一行：名称 / 机器狗 / 巡检方式 -->
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="flex flex-col gap-1">
              <label class="font-mono text-[10px] uppercase tracking-wider text-text-low">任务名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="输入任务名称"
                class="border border-line bg-container px-3 py-2 text-sm text-text-hi placeholder:text-text-low focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-mono text-[10px] uppercase tracking-wider text-text-low">执行机器狗</label>
              <select
                v-model="form.robot"
                class="border border-line bg-container px-3 py-2 text-sm text-text-hi focus:border-primary/60 focus:outline-none [&>option]:bg-container"
              >
                <option v-for="r in robots" :key="r.id" :value="r.name">{{ r.name }}（{{ r.model }}）</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-mono text-[10px] uppercase tracking-wider text-text-low">巡检方式</label>
              <div class="flex h-[38px] items-center gap-1 border border-line bg-container p-1">
                <button
                  v-for="m in ['定时', '周期', '手动触发'] as const"
                  :key="m"
                  class="flex-1 px-2 py-1 text-xs transition-colors"
                  :class="form.mode === m ? 'bg-primary/15 text-primary shadow-[0_0_8px_rgba(0,242,254,0.2)]' : 'text-text-mid hover:text-text-hi'"
                  @click="form.mode = m"
                >
                  {{ m }}
                </button>
              </div>
            </div>
          </div>

          <!-- 巡检点位顺序 -->
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-text-low">
              <span>巡检点位顺序</span>
              <span class="text-primary">共 {{ form.points.length }} 个 Waypoint</span>
            </label>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="(pt, i) in form.points"
                :key="pt"
                class="flex items-center justify-between gap-2 border border-line bg-container px-2.5 py-1.5"
              >
                <div class="flex items-center gap-2 text-xs text-text-hi">
                  <svg class="h-3.5 w-3.5 cursor-grab text-text-low" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
                    <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
                    <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
                  </svg>
                  <span class="flex h-5 w-5 items-center justify-center bg-primary/15 font-mono text-[10px] font-bold text-primary">{{ i + 1 }}</span>
                  <span>#{{ String(i + 1).padStart(2, '0') }} {{ pt }}</span>
                </div>
                <span class="font-mono text-[10px] text-text-low">停留 30s | AI 检测</span>
              </div>
            </div>
          </div>

          <!-- AI 检测项 -->
          <div class="flex flex-col gap-1.5">
            <label class="font-mono text-[10px] uppercase tracking-wider text-text-low">AI 检测项加载</label>
            <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
              <button
                v-for="item in aiOptions"
                :key="item"
                class="flex items-center gap-2 border p-2 text-left transition-colors"
                :class="form.aiItems.includes(item) ? 'border-primary/50 bg-primary/10' : 'border-line bg-container hover:border-line-strong'"
                @click="toggleAiItem(item)"
              >
                <!-- 方形机械复选框 -->
                <span
                  class="flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors"
                  :class="form.aiItems.includes(item) ? 'border-primary bg-primary/30 shadow-[0_0_6px_rgba(0,242,254,0.5)]' : 'border-line-strong bg-panel'"
                >
                  <svg v-if="form.aiItems.includes(item)" class="h-2.5 w-2.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="square">
                    <path d="M4 12.5 10 18 20 6" />
                  </svg>
                </span>
                <span class="text-xs" :class="form.aiItems.includes(item) ? 'text-text-hi' : 'text-text-mid'">{{ item }}</span>
              </button>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="flex items-center justify-end gap-3 border-t border-line pt-3">
            <button
              class="border border-line px-4 py-1.5 text-sm text-text-mid transition-colors hover:border-line-strong hover:bg-elevated hover:text-text-hi"
              @click="resetForm"
            >
              重置
            </button>
            <button
              class="border border-line px-4 py-1.5 text-sm text-text-mid transition-colors hover:border-line-strong hover:bg-elevated hover:text-text-hi"
              @click="onCancel"
            >
              取消
            </button>
            <button
              v-permission="'task:dispatch'"
              class="flex items-center gap-1.5 border border-primary bg-gradient-to-br from-primary/20 to-primary-dim/40 px-5 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(0,242,254,0.25)] transition-all [text-shadow:0_0_8px_rgba(0,242,254,0.6)] hover:from-primary/30 hover:to-primary-dim/60 hover:shadow-[0_0_18px_rgba(0,242,254,0.45)]"
              @click="onSubmit"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              保存并下发
            </button>
          </div>
        </div>
      </HudPanel>
    </section>
  </div>
</template>
