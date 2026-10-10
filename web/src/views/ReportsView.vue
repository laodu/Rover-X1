<script setup lang="ts">
import { computed, ref } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VChart from '../components/VChart.vue'
import { baseChartOption, axisStyle } from '../charts/theme'
import { alarms, reports, robots, type ReportRecord } from '../mock/data'

/* ---------------- 筛选状态（本地交互，无后端） ---------------- */
const timeRanges = ['近7天', '近30天', '本月'] as const
const timeRange = ref<(typeof timeRanges)[number]>('近30天')

const areas = ['全部区域', 'A区', 'B区', '地下管廊', '生活区', '园区周界']
const area = ref(areas[0])

const robotOptions = computed(() => ['全部机器狗', ...robots.map((r) => r.name)])
const robot = ref('全部机器狗')

const reportTypes = ['全部类型', '日报', '周报', '月报']
const reportType = ref(reportTypes[0])

function exportReport(kind: 'PDF' | 'Excel') {
  // 联调前仅作演示提示
  window.alert(`正在导出 ${kind} 报告（${timeRange.value} / ${area.value} / ${robot.value} / ${reportType.value}），后端接入后生效`)
}

/* ---------------- 图表 1：近 30 天任务完成趋势 ---------------- */
const trendDays = 30
const trendDates: string[] = []
const trendValues: number[] = []
for (let i = trendDays - 1; i >= 0; i--) {
  const d = new Date(2026, 9, 10 - i)
  trendDates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  // 确定性伪随机：3~8 之间波动，周末略低
  const base = 5 + Math.round(2.6 * Math.sin((trendDays - i) * 1.7))
  trendValues.push(Math.max(2, Math.min(8, base)))
}

const trendOption = {
  ...baseChartOption(),
  tooltip: { ...baseChartOption().tooltip, trigger: 'axis' },
  grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
  xAxis: {
    type: 'category',
    data: trendDates,
    boundaryGap: false,
    ...axisStyle,
  },
  yAxis: {
    type: 'value',
    name: '次',
    nameTextStyle: { color: '#64748b', fontSize: 10 },
    ...axisStyle,
  },
  series: [
    {
      name: '完成任务',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: trendValues,
      lineStyle: { width: 2, color: '#00f2fe' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 242, 254, 0.28)' },
            { offset: 1, color: 'rgba(0, 242, 254, 0.02)' },
          ],
        },
      },
    },
  ],
}

/* ---------------- 图表 2：告警类型分布（按 mock alarms 统计） ---------------- */
const alarmTypeCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const a of alarms) counts.set(a.type, (counts.get(a.type) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => a[1] - b[1])
})

const alarmTypeOption = computed(() => ({
  ...baseChartOption(),
  tooltip: { ...baseChartOption().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 8, right: 24, top: 8, bottom: 4, containLabel: true },
  xAxis: { type: 'value', ...axisStyle },
  yAxis: {
    type: 'category',
    data: alarmTypeCounts.value.map(([type]) => type),
    ...axisStyle,
    axisLabel: { color: '#94a3b8', fontSize: 10 },
  },
  series: [
    {
      name: '告警次数',
      type: 'bar',
      data: alarmTypeCounts.value.map(([, count]) => count),
      barWidth: 10,
      itemStyle: { color: '#f59e0b', borderRadius: [0, 2, 2, 0] },
      label: { show: true, position: 'right', color: '#f8fafc', fontSize: 10, fontFamily: 'JetBrains Mono' },
    },
  ],
}))

/* ---------------- 图表 3：各区域隐患对比 ---------------- */
const areaHazards = [
  { name: 'A区', value: 32 },
  { name: 'B区', value: 18 },
  { name: '管廊', value: 24 },
  { name: '生活区', value: 9 },
  { name: '周界', value: 6 },
]

const areaOption = {
  ...baseChartOption(),
  tooltip: { ...baseChartOption().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
  xAxis: {
    type: 'category',
    data: areaHazards.map((a) => a.name),
    ...axisStyle,
    axisLabel: { color: '#94a3b8', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    name: '处',
    nameTextStyle: { color: '#64748b', fontSize: 10 },
    ...axisStyle,
  },
  series: [
    {
      name: '发现隐患',
      type: 'bar',
      data: areaHazards.map((a) => a.value),
      barWidth: 18,
      itemStyle: {
        borderRadius: [2, 2, 0, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.25)' },
          ],
        },
      },
    },
  ],
}

/* ---------------- 图表 4：机器狗利用率与里程 ---------------- */
const robotUsage = [
  { name: 'Rover-01', util: 86, mileage: 112 },
  { name: 'Rover-02', util: 74, mileage: 95 },
  { name: 'Rover-03', util: 81, mileage: 105 },
  { name: 'Rover-04', util: 22, mileage: 30 },
]

const robotUsageOption = {
  ...baseChartOption(),
  tooltip: { ...baseChartOption().tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { ...baseChartOption().legend, top: 0, right: 0 },
  grid: { left: 8, right: 24, top: 26, bottom: 4, containLabel: true },
  xAxis: { type: 'value', ...axisStyle },
  yAxis: {
    type: 'category',
    data: robotUsage.map((r) => r.name),
    ...axisStyle,
    axisLabel: { color: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' },
  },
  series: [
    {
      name: '利用率 %',
      type: 'bar',
      data: robotUsage.map((r) => r.util),
      barWidth: 7,
      itemStyle: { color: '#00f2fe', borderRadius: [0, 2, 2, 0] },
    },
    {
      name: '里程 km',
      type: 'bar',
      data: robotUsage.map((r) => r.mileage),
      barWidth: 7,
      itemStyle: { color: '#10b981', borderRadius: [0, 2, 2, 0] },
    },
  ],
}

/* ---------------- 巡检记录表格与分页 ---------------- */
const extraReports: ReportRecord[] = Array.from({ length: 10 }, (_, i) => {
  const src = reports[i % reports.length]!
  const seq = 94 - i
  const day = 9 - Math.floor(i / 2)
  return {
    ...src,
    id: `REP-2042-${String(seq).padStart(3, '0')}`,
    start: src.start.replace(/10-1\d/, `10-0${day}`),
    end: src.end.replace(/10-1\d/, `10-0${day}`),
  }
})
const allReports = [...reports, ...extraReports]

const filteredReports = computed(() =>
  allReports.filter((r) => robot.value === '全部机器狗' || r.robot === robot.value),
)

const pageSize = 5
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredReports.value.length / pageSize)))
const pagedReports = computed(() => {
  const p = Math.min(page.value, totalPages.value)
  return filteredReports.value.slice((p - 1) * pageSize, p * pageSize)
})
const pageNumbers = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= Math.min(3, totalPages.value); i++) pages.push(i)
  return pages
})

function gotoPage(p: number) {
  if (p >= 1 && p <= totalPages.value) page.value = p
}

function selectRobot(name: string) {
  robot.value = name
  page.value = 1
}

const stateTone = (s: ReportRecord['state']) => (s === '已归档' ? 'online' : 'hazard')
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 筛选工具栏 -->
    <HudPanel index="FLT.01" title="报告筛选">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 时间范围单选 -->
        <div class="flex items-center gap-1 border border-line bg-container/60 p-1">
          <button
            v-for="t in timeRanges"
            :key="t"
            class="px-3 py-1 font-mono text-[11px] transition-colors"
            :class="
              timeRange === t
                ? 'bg-primary/15 text-primary shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                : 'text-text-mid hover:text-text-hi'
            "
            @click="timeRange = t; page = 1"
          >
            {{ t }}
          </button>
        </div>

        <!-- 巡检区域 -->
        <label class="flex items-center gap-2 font-mono text-[11px] text-text-low">
          巡检区域
          <select
            v-model="area"
            class="border border-line bg-container px-2.5 py-1.5 font-body text-xs text-text-hi outline-none focus:border-primary/50"
          >
            <option v-for="a in areas" :key="a" :value="a">{{ a }}</option>
          </select>
        </label>

        <!-- 执行机器狗 -->
        <label class="flex items-center gap-2 font-mono text-[11px] text-text-low">
          执行机器狗
          <select
            :value="robot"
            class="border border-line bg-container px-2.5 py-1.5 font-body text-xs text-text-hi outline-none focus:border-primary/50"
            @change="selectRobot(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="r in robotOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>

        <!-- 报告类型 -->
        <label class="flex items-center gap-2 font-mono text-[11px] text-text-low">
          报告类型
          <select
            v-model="reportType"
            class="border border-line bg-container px-2.5 py-1.5 font-body text-xs text-text-hi outline-none focus:border-primary/50"
          >
            <option v-for="t in reportTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <div class="flex-1" />

        <!-- 导出按钮（次按钮样式） -->
        <button
          v-permission="'report:export'"
          class="border border-primary/40 bg-elevated/60 px-4 py-1.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
          @click="exportReport('PDF')"
        >
          导出 PDF
        </button>
        <button
          v-permission="'report:export'"
          class="border border-primary/40 bg-elevated/60 px-4 py-1.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
          @click="exportReport('Excel')"
        >
          导出 Excel
        </button>
      </div>
    </HudPanel>

    <!-- 统计条 -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="本月累计巡检" :value="126" unit="次" sub="较上月 +12.4%" tone="primary" />
      <StatCard label="巡检里程" :value="342" unit="km" sub="4 台机器狗合计" tone="primary" />
      <StatCard label="发现隐患" :value="89" unit="处" sub="含 3 处紧急隐患" tone="warning" />
      <StatCard label="闭环率" :value="96" unit="%" sub="隐患处置高效闭环" tone="success" />
    </div>

    <!-- 图表区 2x2 -->
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <HudPanel index="CHART.01" title="近30天任务完成趋势" status="online">
        <div class="h-56">
          <VChart :option="trendOption" />
        </div>
      </HudPanel>
      <HudPanel index="CHART.02" title="告警类型分布" status="degraded">
        <div class="h-56">
          <VChart :option="alarmTypeOption" />
        </div>
      </HudPanel>
      <HudPanel index="CHART.03" title="各区域隐患对比" status="online">
        <div class="h-56">
          <VChart :option="areaOption" />
        </div>
      </HudPanel>
      <HudPanel index="CHART.04" title="机器狗利用率与里程" status="online">
        <div class="h-56">
          <VChart :option="robotUsageOption" />
        </div>
      </HudPanel>
    </div>

    <!-- 巡检记录 -->
    <HudPanel index="REP.LOG" title="巡检记录">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr class="border-b border-line font-mono text-[10px] uppercase tracking-wider text-text-low">
              <th class="px-3 py-2.5">报告编号</th>
              <th class="px-3 py-2.5">任务名称</th>
              <th class="px-3 py-2.5">执行机器狗</th>
              <th class="px-3 py-2.5">巡检路线</th>
              <th class="px-3 py-2.5">开始时间</th>
              <th class="px-3 py-2.5">结束时间</th>
              <th class="px-3 py-2.5 text-right">覆盖点位</th>
              <th class="px-3 py-2.5 text-right">发现隐患</th>
              <th class="px-3 py-2.5">状态</th>
              <th class="px-3 py-2.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line/60">
            <tr
              v-for="r in pagedReports"
              :key="r.id"
              class="transition-colors hover:bg-elevated/40"
            >
              <td class="px-3 py-2.5 font-mono text-primary">{{ r.id }}</td>
              <td class="px-3 py-2.5 text-text-hi">{{ r.task }}</td>
              <td class="px-3 py-2.5 font-mono text-text-mid">{{ r.robot }}</td>
              <td class="px-3 py-2.5 text-text-mid">{{ r.route }}</td>
              <td class="px-3 py-2.5 font-mono text-text-mid">{{ r.start }}</td>
              <td class="px-3 py-2.5 font-mono text-text-mid">{{ r.end }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-text-hi">{{ r.points }}</td>
              <td class="px-3 py-2.5 text-right font-mono" :class="r.issues > 0 ? 'text-warning' : 'text-success'">
                {{ r.issues }}
              </td>
              <td class="px-3 py-2.5">
                <StatusBadge :text="r.state" :tone="stateTone(r.state)" />
              </td>
              <td class="px-3 py-2.5 text-right">
                <button class="mr-3 font-mono text-[11px] text-primary hover:glow-text hover:underline">查看详情</button>
                <button class="font-mono text-[11px] text-info hover:underline">下载</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页条 -->
      <div class="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span class="font-mono text-[11px] text-text-low">
          每页 {{ pageSize }} 条 · 共 {{ filteredReports.length }} 条记录 · 第 {{ Math.min(page, totalPages) }} / {{ totalPages }} 页
        </span>
        <div class="flex items-center gap-1">
          <button
            class="border border-line bg-container px-3 py-1 font-mono text-[11px] text-text-mid transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page <= 1"
            @click="gotoPage(page - 1)"
          >
            上一页
          </button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            class="border px-3 py-1 font-mono text-[11px] transition-colors"
            :class="
              p === page
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-line bg-container text-text-mid hover:border-primary/40 hover:text-primary'
            "
            @click="gotoPage(p)"
          >
            {{ p }}
          </button>
          <button
            class="border border-line bg-container px-3 py-1 font-mono text-[11px] text-text-mid transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page >= totalPages"
            @click="gotoPage(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </HudPanel>
  </div>
</template>
