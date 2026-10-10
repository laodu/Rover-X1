<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { alarms, type Alarm, type AlarmLevel, type AlarmState, type AlarmType } from '../mock/data'

type LevelFilter = '全部' | AlarmLevel
type TypeFilter = '全部' | AlarmType

const levelOptions: LevelFilter[] = ['全部', '紧急', '重要', '一般']
const typeOptions: TypeFilter[] = ['全部', '烟火识别', '人员越界', '垃圾满溢', '设备过温', '气体异常']

const levelFilter = ref<LevelFilter>('全部')
const typeFilter = ref<TypeFilter>('全部')

// 本地副本，处置操作直接改本地状态
const alarmList = ref<Alarm[]>(alarms.map((a) => ({ ...a })))

const filteredAlarms = computed(() =>
  alarmList.value.filter(
    (a) =>
      (levelFilter.value === '全部' || a.level === levelFilter.value) &&
      (typeFilter.value === '全部' || a.type === typeFilter.value),
  ),
)

const selectedId = ref(alarmList.value[0]?.id ?? '')
const selected = computed(
  () => alarmList.value.find((a) => a.id === selectedId.value) ?? filteredAlarms.value[0],
)

watch([levelFilter, typeFilter], () => {
  if (!filteredAlarms.value.some((a) => a.id === selectedId.value)) {
    selectedId.value = filteredAlarms.value[0]?.id ?? ''
  }
})

const levelStyle: Record<AlarmLevel, string> = {
  紧急: 'border-danger/50 bg-danger/15 text-danger',
  重要: 'border-warning/50 bg-warning/15 text-warning',
  一般: 'border-info/50 bg-info/10 text-info',
}

const stateTone: Record<AlarmState, 'online' | 'active' | 'hazard' | 'danger' | 'muted'> = {
  待处理: 'danger',
  处置中: 'hazard',
  已闭环: 'online',
  误报: 'muted',
}

const panelStatus = computed<'online' | 'degraded' | 'lost'>(() => {
  if (!selected.value) return 'online'
  return selected.value.level === '紧急' ? 'lost' : selected.value.level === '重要' ? 'degraded' : 'online'
})

const detectTag: Record<AlarmType, string> = {
  烟火识别: 'SMOKE',
  人员越界: 'INTRUDER',
  垃圾满溢: 'TRASH FULL',
  设备过温: 'OVERHEAT',
  气体异常: 'GAS LEAK',
  仪表读数异常: 'GAUGE ERR',
}

// 处置流程：已完成节点数（按告警状态推导）
const flowSteps = ['AI 发现', '系统推送', '人工确认', '派发工单', '闭环归档']
const doneCount = computed(() => {
  if (!selected.value) return 0
  const map: Record<AlarmState, number> = { 待处理: 2, 处置中: 3, 已闭环: 5, 误报: 3 }
  return map[selected.value.state]
})

function addSec(time: string, sec: number): string {
  const [h = 0, m = 0, s = 0] = time.split(':').map(Number)
  const d = new Date(2042, 9, 10, h, m, s + sec)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

function stepTime(index: number): string {
  if (!selected.value) return '--:--:--'
  if (index < doneCount.value) return addSec(selected.value.time, index * 4)
  if (index === doneCount.value) return '等待中'
  return '未开始'
}

function confirmAlarm() {
  if (selected.value && selected.value.state === '待处理') selected.value.state = '处置中'
}
function markFalseAlarm() {
  if (selected.value && selected.value.state !== '已闭环') selected.value.state = '误报'
}
function dispatchOrder() {
  if (selected.value && selected.value.state !== '已闭环' && selected.value.state !== '误报')
    selected.value.state = '处置中'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 顶部统计条 -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="待处理告警" :value="8" unit="条" tone="danger" sub="需人工确认处置" />
      <StatCard label="今日新增" :value="12" unit="条" tone="primary" sub="较昨日 +3" />
      <StatCard label="已处置" :value="46" unit="条" tone="success" sub="闭环率 92.0%" />
      <StatCard label="误报" :value="3" unit="条" tone="warning" sub="误报率 4.2%" />
    </div>

    <!-- 筛选行 -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 border border-info/15 bg-panel/70 px-3 py-2 backdrop-blur-md">
      <div class="flex items-center gap-1.5">
        <span class="mr-1 font-mono text-[10px] uppercase tracking-widest text-text-low">级别</span>
        <button
          v-for="opt in levelOptions"
          :key="opt"
          class="border px-2.5 py-1 font-mono text-xs transition-colors"
          :class="
            levelFilter === opt
              ? 'border-primary/60 bg-primary/15 text-primary glow-text'
              : 'border-line text-text-mid hover:border-line-strong hover:text-text-hi'
          "
          @click="levelFilter = opt"
        >
          {{ opt }}
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="mr-1 font-mono text-[10px] uppercase tracking-widest text-text-low">类型</span>
        <button
          v-for="opt in typeOptions"
          :key="opt"
          class="border px-2.5 py-1 font-mono text-xs transition-colors"
          :class="
            typeFilter === opt
              ? 'border-primary/60 bg-primary/15 text-primary glow-text'
              : 'border-line text-text-mid hover:border-line-strong hover:text-text-hi'
          "
          @click="typeFilter = opt"
        >
          {{ opt === '全部' ? '全部类型' : opt }}
        </button>
      </div>
      <div class="flex-1" />
      <span class="font-mono text-[10px] text-text-low">
        FILTERED <span class="text-primary">{{ filteredAlarms.length }}</span> / {{ alarmList.length }}
      </span>
    </div>

    <!-- 主体：左列表 55% / 右详情 45% -->
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-11">
      <!-- 告警列表 -->
      <HudPanel index="A-01" title="告警列表" status="online" class="xl:col-span-6">
        <template #actions>
          <span class="font-mono text-[10px] text-text-low">共 {{ filteredAlarms.length }} 条</span>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-xs">
            <thead>
              <tr class="border-b border-line font-mono text-[10px] uppercase tracking-wider text-text-low">
                <th class="px-2 py-2 font-medium">级别</th>
                <th class="px-2 py-2 font-medium">类型</th>
                <th class="px-2 py-2 font-medium">位置</th>
                <th class="px-2 py-2 font-medium">来源机器狗</th>
                <th class="px-2 py-2 font-medium">时间</th>
                <th class="px-2 py-2 font-medium">置信度</th>
                <th class="px-2 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in filteredAlarms"
                :key="a.id"
                class="cursor-pointer border-b border-line/60 transition-colors"
                :class="
                  a.id === selected?.id
                    ? 'bg-primary/10 shadow-[inset_0_0_0_1px_rgba(0,242,254,0.55)]'
                    : 'hover:bg-elevated/50'
                "
                @click="selectedId = a.id"
              >
                <td class="px-2 py-2.5">
                  <span
                    class="inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px]"
                    :class="levelStyle[a.level]"
                  >
                    <span
                      class="h-1 w-1 rounded-full bg-current"
                      :class="{ 'animate-pulse': a.level === '紧急' && a.state === '待处理' }"
                    />
                    {{ a.level }}
                  </span>
                </td>
                <td class="px-2 py-2.5 font-medium text-text-hi">{{ a.type }}</td>
                <td class="px-2 py-2.5 text-primary-dim">{{ a.location }}</td>
                <td class="px-2 py-2.5 font-mono text-text-mid">{{ a.robot }}</td>
                <td class="px-2 py-2.5 font-mono text-text-mid">{{ a.time }}</td>
                <td class="px-2 py-2.5 font-mono text-success">{{ a.confidence.toFixed(1) }}%</td>
                <td class="px-2 py-2.5">
                  <StatusBadge :text="a.state" :tone="stateTone[a.state]" />
                </td>
              </tr>
              <tr v-if="filteredAlarms.length === 0">
                <td colspan="7" class="px-2 py-8 text-center font-mono text-xs text-text-low">
                  // 当前筛选条件下无告警记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </HudPanel>

      <!-- 告警详情与处置 -->
      <HudPanel index="A-02" title="告警详情与处置" :status="panelStatus" class="xl:col-span-5">
        <template #actions>
          <span class="border border-danger/40 bg-danger/10 px-1.5 py-0.5 font-mono text-[10px] text-danger">
            SYS_ID: {{ selected?.id ?? 'N/A' }}
          </span>
        </template>

        <div v-if="selected" class="flex flex-col gap-3">
          <!-- 告警抓图（夜视模拟 + AI 检测框） -->
          <div class="relative h-52 overflow-hidden border border-info/20">
            <div class="absolute inset-0 bg-gradient-to-br from-[#0c1a26] via-[#0a1420] to-[#04080f]" />
            <div
              class="absolute inset-0 opacity-60"
              style="
                background-image:
                  repeating-linear-gradient(0deg, rgba(56, 189, 248, 0.06) 0 1px, transparent 1px 3px),
                  radial-gradient(ellipse at 65% 35%, rgba(16, 185, 129, 0.12), transparent 55%);
              "
            />
            <div class="absolute inset-0 bg-gradient-to-t from-canvas/90 via-transparent to-canvas/40" />

            <!-- HUD 标注 -->
            <div class="absolute left-2 top-2 flex flex-col gap-1 font-mono text-[9px]">
              <span class="border border-primary/30 bg-canvas/80 px-1.5 py-0.5 text-primary">
                SECURE FEED // NIGHT VISION // {{ selected.location }}
              </span>
              <span class="border border-danger/40 bg-canvas/80 px-1.5 py-0.5 font-bold text-danger">
                ALERT: {{ selected.type }} ({{ selected.level }})
              </span>
            </div>

            <!-- AI 检测框 -->
            <div class="absolute right-[24%] top-[22%] h-28 w-28 animate-pulse border-2 border-danger">
              <span class="absolute -left-0.5 -top-0.5 h-2 w-2 border-l-2 border-t-2 border-danger" />
              <span class="absolute -right-0.5 -top-0.5 h-2 w-2 border-r-2 border-t-2 border-danger" />
              <span class="absolute -bottom-0.5 -left-0.5 h-2 w-2 border-b-2 border-l-2 border-danger" />
              <span class="absolute -bottom-0.5 -right-0.5 h-2 w-2 border-b-2 border-r-2 border-danger" />
              <span class="absolute left-0 top-0 bg-danger px-1 py-0.5 font-mono text-[9px] font-bold text-white">
                {{ detectTag[selected.type] }} {{ selected.confidence.toFixed(1) }}%
              </span>
            </div>

            <!-- 底部参数条 -->
            <div
              class="absolute inset-x-2 bottom-2 flex items-center justify-between border border-line bg-canvas/80 px-2 py-1 font-mono text-[10px] backdrop-blur"
            >
              <span class="text-text-mid">镜头: 4K Thermal Night-Vision</span>
              <span class="text-primary">FPS: 60 // Latency: 14ms</span>
            </div>
          </div>

          <!-- 告警信息网格 -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-3 border border-line bg-container/50 p-3">
            <div>
              <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">发生位置</div>
              <div class="mt-0.5 font-mono text-sm text-text-hi">{{ selected.location }}</div>
            </div>
            <div>
              <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">巡检机器狗</div>
              <div class="mt-0.5 font-mono text-sm text-text-hi">{{ selected.robot }}</div>
            </div>
            <div>
              <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">AI 置信度</div>
              <div class="mt-0.5 font-mono text-sm font-bold text-success">
                {{ selected.confidence.toFixed(1) }}%
              </div>
            </div>
            <div>
              <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">发生时间</div>
              <div class="mt-0.5 font-mono text-sm text-text-hi">2042-10-10 {{ selected.time }}</div>
            </div>
          </div>

          <!-- 处置流程时间线 -->
          <div class="border border-line bg-container/50 p-3">
            <div class="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-low">处置流程时间线</div>
            <div
              v-for="(step, i) in flowSteps"
              :key="step"
              class="flex items-stretch gap-3"
            >
              <div class="flex flex-col items-center">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]"
                  :class="
                    i < doneCount
                      ? 'border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(0,242,254,0.4)]'
                      : i === doneCount
                        ? 'animate-pulse border-warning bg-warning/20 text-warning shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                        : 'border-line-strong bg-elevated text-text-low'
                  "
                >
                  {{ i < doneCount ? '✓' : i + 1 }}
                </span>
                <span v-if="i < flowSteps.length - 1" class="my-0.5 w-px flex-1"
                  :class="i < doneCount - 1 ? 'bg-primary/50' : 'bg-line'" />
              </div>
              <div class="flex flex-1 items-baseline justify-between pb-3">
                <span
                  class="text-xs"
                  :class="
                    i < doneCount ? 'font-medium text-text-hi' : i === doneCount ? 'font-medium text-warning' : 'text-text-low'
                  "
                >
                  {{ step }}
                </span>
                <span class="font-mono text-[10px] text-text-low">{{ stepTime(i) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="grid grid-cols-2 gap-2">
            <button
              v-permission="'alarm:handle'"
              class="border border-primary bg-primary/20 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/30 shadow-[0_0_14px_rgba(0,242,254,0.2)]"
              @click="confirmAlarm"
            >
              确认告警
            </button>
            <button
              v-permission="'alarm:handle'"
              class="border border-warning/60 bg-warning/10 py-2 text-xs font-semibold text-warning transition-colors hover:bg-warning/20"
              @click="markFalseAlarm"
            >
              标记误报
            </button>
            <button
              class="border border-line-strong bg-elevated py-2 text-xs font-semibold text-info transition-colors hover:bg-container"
            >
              远程查看现场
            </button>
            <button
              v-permission="'alarm:handle'"
              class="border border-danger/60 bg-danger/15 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/25"
              @click="dispatchOrder"
            >
              派发工单
            </button>
          </div>
        </div>
        <div v-else class="py-10 text-center font-mono text-xs text-text-low">// 未选中任何告警</div>
      </HudPanel>
    </div>
  </div>
</template>
