<script setup lang="ts">
import { computed, ref } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VChart from '../components/VChart.vue'
import { baseChartOption, axisStyle, CHART_COLORS } from '../charts/theme'
import {
  robots,
  alarms,
  tasks,
  robotStatusText,
  type Alarm,
  type AlarmLevel,
  type AlarmState,
  type RobotStatus,
  type TaskState,
} from '../mock/data'

/* ---------- 左栏：告警类型分布环形图 ---------- */
const alarmTypeData = computed(() => {
  const counter = new Map<string, number>()
  for (const a of alarms) counter.set(a.type, (counter.get(a.type) ?? 0) + 1)
  return [...counter.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((x, y) => y.value - x.value)
})

const alarmTotal = computed(() => alarmTypeData.value.reduce((s, d) => s + d.value, 0))

const pieOption = computed(() => ({
  ...baseChartOption(),
  legend: { show: false },
  series: [
    {
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      itemStyle: { borderColor: '#0a1124', borderWidth: 2 },
      emphasis: { scaleSize: 4 },
      data: alarmTypeData.value,
    },
  ],
}))

/* ---------- 中栏：园区态势图 ---------- */
interface Waypoint {
  x: number
  y: number
  label: string
  done: boolean
}

const waypoints: Waypoint[] = [
  { x: 14, y: 26, label: 'WP-01', done: true },
  { x: 30, y: 16, label: 'WP-02', done: true },
  { x: 46, y: 38, label: 'WP-03', done: false },
  { x: 60, y: 24, label: 'WP-04', done: false },
  { x: 76, y: 36, label: 'WP-05', done: false },
  { x: 86, y: 58, label: 'WP-06', done: false },
  { x: 62, y: 72, label: 'WP-07', done: false },
  { x: 36, y: 64, label: 'WP-08', done: false },
]

const routePoints = waypoints.map((w) => `${w.x},${w.y}`).join(' ')

const robotMarkerColor: Record<RobotStatus, string> = {
  patrol: 'bg-primary shadow-[0_0_8px_rgba(0,242,254,0.9)]',
  charging: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.9)]',
  standby: 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.9)]',
  maintenance: 'bg-text-low',
}

const robotLabelColor: Record<RobotStatus, string> = {
  patrol: 'text-primary border-primary/50',
  charging: 'text-warning border-warning/50',
  standby: 'text-success border-success/50',
  maintenance: 'text-text-low border-line-strong',
}

/* ---------- 中栏：实时告警事件流（本地处置状态） ---------- */
const alarmList = ref<Alarm[]>(alarms.map((a) => ({ ...a })))

const levelStyle: Record<AlarmLevel, string> = {
  紧急: 'bg-danger/15 text-danger border border-danger/40',
  重要: 'bg-warning/15 text-warning border border-warning/40',
  一般: 'bg-info/15 text-info border border-info/40',
}

const stateTone: Record<AlarmState, 'danger' | 'hazard' | 'online' | 'muted'> = {
  待处理: 'danger',
  处置中: 'hazard',
  已闭环: 'online',
  误报: 'muted',
}

const pendingCount = computed(
  () => alarmList.value.filter((a) => a.state === '待处理' || a.state === '处置中').length,
)

function handleAction(alarm: Alarm) {
  if (alarm.state === '待处理') alarm.state = '处置中'
  else if (alarm.state === '处置中') alarm.state = '已闭环'
}

function actionText(state: AlarmState) {
  if (state === '待处理') return '开始处置'
  if (state === '处置中') return '确认闭环'
  return state
}

/* ---------- 右栏：机器狗集群状态 ---------- */
const robotBadgeTone: Record<RobotStatus, 'active' | 'hazard' | 'online' | 'muted'> = {
  patrol: 'active',
  charging: 'hazard',
  standby: 'online',
  maintenance: 'muted',
}

function batteryBarClass(battery: number) {
  if (battery >= 60) return 'bg-gradient-to-r from-primary to-success'
  if (battery >= 30) return 'bg-warning'
  return 'bg-danger'
}

function batteryTextClass(battery: number) {
  if (battery >= 60) return 'text-success'
  if (battery >= 30) return 'text-warning'
  return 'text-danger'
}

/* ---------- 右栏：排期任务 ---------- */
const taskStateColor: Record<TaskState, string> = {
  进行中: 'text-primary',
  待执行: 'text-text-low',
  已完成: 'text-success',
  异常: 'text-danger',
}

/* ---------- 右栏：近 7 天巡检趋势 ---------- */
const trendDates = ['10-04', '10-05', '10-06', '10-07', '10-08', '10-09', '10-10']

const lineOption = computed(() => ({
  ...baseChartOption(),
  legend: { ...baseChartOption().legend, top: 0 },
  xAxis: { type: 'category', data: trendDates, boundaryGap: false, ...axisStyle },
  yAxis: { type: 'value', ...axisStyle },
  series: [
    {
      name: '巡检里程 km',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      data: [18.2, 21.5, 19.8, 24.6, 22.1, 26.3, 23.7],
      lineStyle: { width: 2, color: CHART_COLORS[0] },
      itemStyle: { color: CHART_COLORS[0] },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 242, 254, 0.28)' },
            { offset: 1, color: 'rgba(0, 242, 254, 0)' },
          ],
        },
      },
    },
    {
      name: '告警数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: [9, 7, 11, 8, 6, 10, 12],
      lineStyle: { width: 1.5, type: 'dashed', color: CHART_COLORS[2] },
      itemStyle: { color: CHART_COLORS[2] },
    },
  ],
}))
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
    <!-- ========== 左栏：核心指标 + 告警分布 ========== -->
    <aside class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <StatCard label="在线机器狗" :value="3" unit="/ 4 台" tone="success" sub="在线率 75% · 1 台维保" />
        <StatCard label="任务完成率" :value="87" unit="%" sub="较昨日 +5.2%" />
        <StatCard label="今日告警" :value="12" unit="条" tone="danger" sub="紧急 2 · 重要 4 · 一般 6" />
        <StatCard label="点位覆盖率" :value="95" unit="%" tone="primary" sub="228 / 240 点位" />
      </div>

      <HudPanel index="SYS.05" title="告警类型分布" status="online" class="flex-1">
        <div class="grid grid-cols-2 items-center gap-2">
          <div class="relative h-44">
            <VChart :option="pieOption" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-mono text-[10px] uppercase tracking-widest text-text-low">总告警</span>
              <span class="glow-text font-mono text-xl font-bold leading-tight text-primary">{{ alarmTotal }}</span>
            </div>
          </div>
          <ul class="space-y-1.5">
            <li
              v-for="(d, i) in alarmTypeData"
              :key="d.name"
              class="flex items-center justify-between font-mono text-[11px]"
            >
              <span class="flex items-center gap-1.5 text-text-mid">
                <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }" />
                {{ d.name }}
              </span>
              <span class="text-text-hi">
                {{ d.value }}
                <span class="text-text-low">({{ Math.round((d.value / alarmTotal) * 100) }}%)</span>
              </span>
            </li>
          </ul>
        </div>
        <div class="mt-2 flex items-center justify-between border-t border-line pt-2 font-mono text-[10px] text-text-low">
          <span>AI 识别算法自校验: <span class="text-success">准确率 99.4%</span></span>
          <span class="cursor-pointer text-primary-dim hover:text-primary">详细诊断 &gt;</span>
        </div>
      </HudPanel>
    </aside>

    <!-- ========== 中栏：园区态势图 + 告警事件流 ========== -->
    <section class="flex min-w-0 flex-col gap-4">
      <HudPanel index="MAP.2D" title="园区态势图" status="online">
        <template #actions>
          <span class="font-mono text-[10px] uppercase tracking-wider text-text-low">EPSG:3857 · 激光点云融合 99.8%</span>
        </template>

        <div class="map-grid relative h-[430px] overflow-hidden border border-line bg-surface/60">
          <!-- 扫描线 -->
          <div class="scan-sweep pointer-events-none absolute inset-x-0 top-0 h-16" />

          <!-- 建筑区块 -->
          <div class="absolute left-[8%] top-[8%] h-[18%] w-[20%] border border-info/40 bg-container/80">
            <span class="absolute left-1.5 top-1 font-mono text-[10px] font-bold text-info">研发楼 A栋 [HQ]</span>
            <span class="absolute bottom-1 left-1.5 font-mono text-[9px] text-text-low">BLDG-A · 常态</span>
          </div>
          <div class="absolute right-[10%] top-[10%] h-[20%] w-[24%] border border-danger/60 bg-container/80 shadow-[0_0_18px_rgba(239,68,68,0.15)]">
            <span class="absolute left-1.5 top-1 font-mono text-[10px] font-bold text-danger">智能车间 B栋 (配电室)</span>
            <span class="absolute bottom-1 left-1.5 font-mono text-[9px] text-danger/80">BLDG-B · 过温告警</span>
          </div>
          <div class="absolute bottom-[12%] left-[10%] h-[16%] w-[18%] border border-info/30 bg-container/80">
            <span class="absolute left-1.5 top-1 font-mono text-[10px] font-bold text-info/80">储能电站 C栋</span>
            <span class="absolute bottom-1 left-1.5 font-mono text-[9px] text-text-low">BLDG-C · 常态</span>
          </div>
          <div class="absolute bottom-[8%] left-[38%] h-[18%] w-[26%] border border-dashed border-info/30 bg-container/40">
            <span class="absolute left-1.5 top-1 font-mono text-[10px] text-text-mid">室外立体仓储区</span>
          </div>
          <div class="absolute right-[6%] top-[48%] h-[12%] w-[14%] border border-success/50 bg-success/5">
            <span class="absolute left-1.5 top-1 font-mono text-[10px] text-success">南门货运闸口</span>
          </div>

          <!-- 巡检路线 -->
          <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              :points="routePoints"
              fill="none"
              stroke="rgba(0, 242, 254, 0.25)"
              stroke-width="1.6"
              vector-effect="non-scaling-stroke"
            />
            <polyline
              class="route-dash"
              :points="routePoints"
              fill="none"
              stroke="#00f2fe"
              stroke-width="2"
              stroke-dasharray="6 5"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <!-- WAYPOINT 点位 -->
          <div
            v-for="w in waypoints"
            :key="w.label"
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="{ left: w.x + '%', top: w.y + '%' }"
          >
            <span
              class="block h-2 w-2 rounded-full border"
              :class="
                w.done
                  ? 'border-success bg-success shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : 'border-primary/70 bg-panel'
              "
            />
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px]"
              :class="w.done ? 'text-success/80' : 'text-text-low'"
            >
              {{ w.label }}{{ w.done ? ' 完成' : '' }}
            </span>
          </div>

          <!-- 机器狗标记 -->
          <div
            v-for="r in robots"
            :key="r.id"
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="{ left: r.position.x + '%', top: r.position.y + '%' }"
          >
            <span
              v-if="r.status === 'patrol'"
              class="robot-ping absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60"
            />
            <span class="relative block h-2.5 w-2.5 rounded-full" :class="robotMarkerColor[r.status]" />
            <span
              class="absolute left-3.5 top-1/2 -translate-y-1/2 whitespace-nowrap border bg-panel/85 px-1 py-px font-mono text-[9px]"
              :class="robotLabelColor[r.status]"
            >
              {{ r.name }} · {{ robotStatusText[r.status] }}
            </span>
          </div>

          <!-- 左下角坐标 HUD -->
          <div class="absolute bottom-2 left-2 flex items-center gap-3 border border-line bg-panel/80 px-2.5 py-1 font-mono text-[10px] text-text-low backdrop-blur-md">
            <span class="text-primary-dim">北偏东 24.8°</span>
            <span>X: 124.42 | Y: 088.19</span>
            <span class="text-success">延迟 14ms</span>
          </div>
        </div>
      </HudPanel>

      <HudPanel index="ALM.STREAM" title="实时告警事件流" :status="pendingCount > 0 ? 'lost' : 'online'">
        <template #actions>
          <span class="border border-danger/40 bg-danger/15 px-1.5 py-0.5 font-mono text-[10px] text-danger">
            {{ pendingCount }} 条待处置
          </span>
        </template>

        <div class="max-h-56 divide-y divide-line/60 overflow-y-auto">
          <div
            v-for="a in alarmList"
            :key="a.id"
            class="flex items-center gap-3 px-1 py-2 transition-colors hover:bg-container/60"
          >
            <span class="font-mono text-[11px] text-text-low">{{ a.time }}</span>
            <span class="shrink-0 px-1.5 py-0.5 font-mono text-[10px] font-bold" :class="levelStyle[a.level]">
              {{ a.level }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-xs text-text-hi">
                <span class="font-semibold">{{ a.type }}</span>
                <span class="text-text-mid"> · {{ a.location }}</span>
              </div>
              <div class="mt-0.5 font-mono text-[10px] text-text-low">
                {{ a.id }} · {{ a.robot }} · 置信度 {{ a.confidence }}%
              </div>
            </div>
            <StatusBadge :text="a.state" :tone="stateTone[a.state]" />
            <button
              class="shrink-0 border px-2 py-0.5 font-mono text-[10px] transition-colors"
              :class="
                a.state === '已闭环' || a.state === '误报'
                  ? 'cursor-default border-line text-text-low'
                  : 'border-primary/50 text-primary hover:bg-primary hover:text-canvas'
              "
              :disabled="a.state === '已闭环' || a.state === '误报'"
              @click="handleAction(a)"
            >
              {{ actionText(a.state) }}
            </button>
          </div>
        </div>
      </HudPanel>
    </section>

    <!-- ========== 右栏：集群状态 + 排期任务 + 趋势 ========== -->
    <aside class="flex flex-col gap-4">
      <HudPanel index="FLEET.04" title="机器狗集群状态" status="online">
        <template #actions>
          <span class="font-mono text-[10px] text-success">3 台在线 / 1 台维保</span>
        </template>
        <div class="space-y-2.5">
          <div
            v-for="r in robots"
            :key="r.id"
            class="border border-line bg-container/60 p-2.5"
            :class="{ 'opacity-60': r.status === 'maintenance' }"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-headline text-xs font-bold text-text-hi">{{ r.name }}</span>
              <StatusBadge :text="robotStatusText[r.status]" :tone="robotBadgeTone[r.status]" />
            </div>
            <div class="mt-2 flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                <div
                  class="h-full rounded-full"
                  :class="batteryBarClass(r.battery)"
                  :style="{ width: r.battery + '%' }"
                />
              </div>
              <span class="font-mono text-[11px] font-bold" :class="batteryTextClass(r.battery)">
                {{ r.battery }}%
              </span>
            </div>
            <div class="mt-1.5 flex items-center justify-between font-mono text-[10px] text-text-low">
              <span>今日里程 <span class="text-text-hi">{{ r.mileageToday.toFixed(1) }} km</span></span>
              <span>{{ r.network }}<template v-if="r.signalMs"> · {{ r.signalMs }}ms</template></span>
            </div>
          </div>
        </div>
      </HudPanel>

      <HudPanel index="TSK.SCHED" title="当前排期任务" status="online">
        <template #actions>
          <span class="font-mono text-[10px] text-text-low">今日共 {{ tasks.length }} 批</span>
        </template>
        <div class="space-y-2">
          <div v-for="t in tasks" :key="t.id" class="border border-line bg-container/60 p-2">
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="truncate font-semibold text-text-hi">{{ t.name }}</span>
              <span class="shrink-0 font-mono text-[11px] font-bold" :class="taskStateColor[t.state]">
                {{ t.state === '进行中' ? t.progress + '%' : t.state }}
              </span>
            </div>
            <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
              <div
                class="h-full rounded-full"
                :class="t.state === '异常' ? 'bg-danger' : t.progress === 100 ? 'bg-success' : 'bg-primary'"
                :style="{ width: t.progress + '%' }"
              />
            </div>
            <div class="mt-1 flex items-center justify-between font-mono text-[10px] text-text-low">
              <span>{{ t.id }} · {{ t.robot }}</span>
              <span>{{ t.schedule }}</span>
            </div>
          </div>
        </div>
      </HudPanel>

      <HudPanel index="TREND.7D" title="近 7 天巡检趋势" status="online" class="flex-1">
        <div class="h-44">
          <VChart :option="lineOption" />
        </div>
        <div class="mt-2 flex items-center justify-between border-t border-line pt-2 font-mono text-[10px] text-text-low">
          <span>巡检总里程: <span class="font-bold text-primary">156.2 km</span></span>
          <span>累计排除隐患: <span class="font-bold text-warning">63 起</span></span>
        </div>
      </HudPanel>
    </aside>
  </div>
</template>

<style scoped>
.map-grid {
  background-image:
    linear-gradient(rgba(0, 242, 254, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 254, 0.05) 1px, transparent 1px);
  background-size: 28px 28px;
}

@keyframes robot-ping {
  0% {
    transform: translate(-50%, -50%) scale(0.4);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
}
.robot-ping {
  animation: robot-ping 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

@keyframes route-flow {
  to {
    stroke-dashoffset: -44;
  }
}
.route-dash {
  animation: route-flow 2.4s linear infinite;
}

@keyframes scan-sweep {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(700%);
  }
}
.scan-sweep {
  background: linear-gradient(180deg, transparent 0%, rgba(0, 242, 254, 0.08) 50%, transparent 100%);
  animation: scan-sweep 5s linear infinite;
}
</style>
