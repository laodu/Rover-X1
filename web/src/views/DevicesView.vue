<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EChartsCoreOption } from 'echarts/core'
import HudPanel from '../components/HudPanel.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VChart from '../components/VChart.vue'
import RobotGlyph from './devices/RobotGlyph.vue'
import { baseChartOption } from '../charts/theme'
import { robots, robotStatusText, type RobotStatus } from '../mock/data'

const selectedId = ref(robots[0].id)
const selected = computed(() => robots.find((r) => r.id === selectedId.value)!)

const statusTone: Record<RobotStatus, 'online' | 'active' | 'hazard' | 'danger' | 'muted'> = {
  patrol: 'active',
  charging: 'hazard',
  standby: 'muted',
  maintenance: 'danger',
}

const onlineCount = computed(() => robots.filter((r) => r.status !== 'maintenance').length)

function batteryClass(level: number): string {
  if (level >= 60) return 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]'
  if (level >= 25) return 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.6)]'
  return 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.6)]'
}
function batteryTextClass(level: number): string {
  if (level >= 60) return 'text-success'
  if (level >= 25) return 'text-warning'
  return 'text-danger'
}

// 设备档案（示例静态数据，联调后由接口下发）
interface DeviceProfile {
  serial: string
  firmware: string
  runHours: string
  soh: number
  motorTemp: number
  jointOk: number
  jointTotal: number
}
const profiles: Record<string, DeviceProfile> = {
  R01: { serial: 'SN-2042-0101', firmware: 'v2.3.1', runHours: '1,420', soh: 92, motorTemp: 38.2, jointOk: 12, jointTotal: 12 },
  R02: { serial: 'SN-2042-0102', firmware: 'v2.3.1', runHours: '1,186', soh: 95, motorTemp: 31.6, jointOk: 12, jointTotal: 12 },
  R03: { serial: 'SN-2042-0103', firmware: 'v2.3.0', runHours: '987', soh: 97, motorTemp: 28.4, jointOk: 12, jointTotal: 12 },
  R04: { serial: 'SN-2042-0104', firmware: 'v2.2.8', runHours: '2,053', soh: 78, motorTemp: 41.7, jointOk: 10, jointTotal: 12 },
}
const profile = computed(() => profiles[selected.value.id])

const sensors = [
  { name: '前双目深度相机', model: 'D435i ×1', online: true },
  { name: '后双目深度相机', model: 'D435i ×1', online: true },
  { name: 'IMU 惯性测量单元', model: 'BMI088', online: true },
  { name: '激光雷达', model: 'MID-360', online: true },
]
const comms = [
  { name: 'WiFi / 4G 信号', detail: '-58 dBm · 12 ms', ok: true },
  { name: 'RTSP 视频流', detail: '1080p@30 正常', ok: true },
  { name: 'gRPC 控制连接', detail: 'TLS 1.3 已建立', ok: true },
]

// 电池健康度径向仪表盘
const gaugeOption = computed<EChartsCoreOption>(() => ({
  ...baseChartOption(),
  series: [
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      radius: '100%',
      center: ['50%', '58%'],
      progress: {
        show: true,
        width: 8,
        itemStyle: { color: profile.value.soh >= 85 ? '#10b981' : '#f59e0b' },
      },
      axisLine: { lineStyle: { width: 8, color: [[1, 'rgba(56,189,248,0.12)']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { offsetCenter: [0, '34%'], color: '#64748b', fontSize: 11 },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '-4%'],
        formatter: '{value}%',
        color: '#f8fafc',
        fontSize: 26,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
      },
      data: [{ value: profile.value.soh, name: 'SOH' }],
    },
  ],
}))

// 运维操作（本地状态模拟）
const otaProgress = ref(68)
const opMessage = ref('安全控制密码已验证 · 通道就绪')
function runOp(name: string) {
  opMessage.value = `${name} 指令已下发至 ${selected.value.name} · 等待回执`
}
</script>

<template>
  <div class="flex h-full flex-col gap-4 lg:flex-row">
    <!-- 左栏：设备卡片网格 -->
    <section class="flex shrink-0 flex-col gap-3 lg:w-[38%]">
      <div class="flex items-center justify-between border-b border-line pb-2">
        <h2 class="font-headline text-sm font-semibold tracking-wide text-text-hi">
          <span class="text-primary glow-text">[FLT.01 //</span> 机器人集群设备列表
          <span class="text-primary glow-text">]</span>
        </h2>
        <span class="border border-line bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-mid">
          在线 {{ onlineCount }} / 总计 {{ robots.length }}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="robot in robots"
          :key="robot.id"
          type="button"
          class="group relative flex flex-col gap-2 border bg-panel/70 p-3 text-left backdrop-blur-md transition-all"
          :class="
            selectedId === robot.id
              ? 'border-primary/70 shadow-[0_0_18px_rgba(0,242,254,0.22)]'
              : 'border-info/15 hover:border-primary/40'
          "
          @click="selectedId = robot.id"
        >
          <!-- 选中态左侧指示条 -->
          <span
            v-if="selectedId === robot.id"
            class="absolute inset-y-0 left-0 w-0.5 bg-primary shadow-[0_0_8px_rgba(0,242,254,0.8)]"
          />

          <!-- 机器狗实拍图 -->
          <div class="h-20 border border-line/60 bg-canvas/60 px-2 py-1">
            <RobotGlyph :dim="robot.status === 'maintenance'" />
          </div>

          <!-- 名称 + 状态 -->
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div
                class="truncate font-headline text-sm font-bold"
                :class="selectedId === robot.id ? 'text-primary glow-text' : 'text-text-hi'"
              >
                {{ robot.name }}
              </div>
              <div class="truncate text-[11px] text-text-low">{{ robot.model }}</div>
            </div>
            <StatusBadge :text="robotStatusText[robot.status]" :tone="statusTone[robot.status]" />
          </div>

          <!-- 电量条形指示 -->
          <div>
            <div class="mb-1 flex items-center justify-between font-mono text-[10px] text-text-low">
              <span>电量</span>
              <span :class="batteryTextClass(robot.battery)">{{ robot.battery }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden bg-line/60">
              <div class="h-full" :class="batteryClass(robot.battery)" :style="{ width: robot.battery + '%' }" />
            </div>
          </div>

          <!-- 里程 / 信号 -->
          <div class="flex items-center justify-between border-t border-line/60 pt-2 font-mono text-[11px]">
            <span class="text-text-low">
              今日里程
              <span class="text-text-hi">{{ robot.mileageToday.toFixed(1) }}</span> km
            </span>
            <span :class="robot.network === '离线' ? 'text-danger' : 'text-primary'">
              {{ robot.network === '离线' ? '离线' : `${robot.network} · ${robot.signalMs}ms` }}
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- 右栏：选中设备详情 -->
    <section class="flex min-w-0 flex-1 flex-col gap-4">
      <!-- 基本信息 -->
      <HudPanel index="DEV.01" :title="`${selected.name} 核心设备遥测终端`" :status="selected.status === 'maintenance' ? 'lost' : 'online'">
        <template #actions>
          <StatusBadge :text="robotStatusText[selected.status]" :tone="statusTone[selected.status]" />
        </template>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="border border-line/60 bg-container/60 p-2.5">
            <div class="font-mono text-[10px] uppercase tracking-wide text-text-low">设备型号</div>
            <div class="mt-1 text-sm font-semibold text-text-hi">{{ selected.model }}</div>
          </div>
          <div class="border border-line/60 bg-container/60 p-2.5">
            <div class="font-mono text-[10px] uppercase tracking-wide text-text-low">序列号 (SN)</div>
            <div class="mt-1 font-mono text-sm font-semibold text-primary">{{ profile.serial }}</div>
          </div>
          <div class="border border-line/60 bg-container/60 p-2.5">
            <div class="font-mono text-[10px] uppercase tracking-wide text-text-low">固件版本</div>
            <div class="mt-1 font-mono text-sm font-semibold text-success">{{ profile.firmware }} (Stable)</div>
          </div>
          <div class="border border-line/60 bg-container/60 p-2.5">
            <div class="font-mono text-[10px] uppercase tracking-wide text-text-low">已运行时长</div>
            <div class="mt-1 font-mono text-sm font-semibold text-text-hi">{{ profile.runHours }} h</div>
          </div>
        </div>
      </HudPanel>

      <!-- 健康监测 -->
      <HudPanel index="DEV.02" title="健康监测" status="online">
        <template #actions>
          <span class="font-mono text-[10px] text-success">全项指标正常</span>
        </template>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <!-- 电池健康度仪表盘 -->
          <div class="border border-line/60 bg-container/60 p-2">
            <div class="px-1 font-mono text-[10px] uppercase tracking-wide text-text-low">电池健康度</div>
            <div class="h-40">
              <VChart :option="gaugeOption" />
            </div>
          </div>

          <!-- 电机温度 + 关节状态 -->
          <div class="flex flex-col gap-3">
            <div class="border border-line/60 bg-container/60 p-3">
              <div class="font-mono text-[10px] uppercase tracking-wide text-text-low">核心电机温度</div>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="font-mono text-3xl font-bold text-primary glow-text">{{ profile.motorTemp.toFixed(1) }}</span>
                <span class="font-mono text-xs text-text-low">℃</span>
              </div>
              <div class="mt-2 h-1.5 w-full overflow-hidden bg-line/60">
                <div class="h-full bg-primary shadow-[0_0_6px_rgba(0,242,254,0.6)]" :style="{ width: profile.motorTemp + '%' }" />
              </div>
              <div class="mt-1 flex justify-between font-mono text-[10px] text-text-low">
                <span>0</span><span>告警阈值 85℃</span>
              </div>
            </div>
            <div class="flex items-center justify-between border border-line/60 bg-container/60 p-3">
              <span class="text-xs text-text-mid">四肢关节伺服状态</span>
              <span class="flex items-center gap-1.5 font-mono text-xs" :class="profile.jointOk === profile.jointTotal ? 'text-success' : 'text-warning'">
                <span class="h-1.5 w-1.5 rounded-full" :class="profile.jointOk === profile.jointTotal ? 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]' : 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.9)]'" />
                {{ profile.jointOk }}/{{ profile.jointTotal }} 正常
              </span>
            </div>
          </div>
        </div>

        <!-- 传感器 / 通信状态列表 -->
        <div class="mt-3 grid grid-cols-1 gap-3 border-t border-line/60 pt-3 md:grid-cols-2">
          <div>
            <div class="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-low">传感器阵列状态</div>
            <div class="flex flex-col gap-1.5">
              <div v-for="s in sensors" :key="s.name" class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2 text-text-mid">
                  <span class="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                  {{ s.name }}
                </span>
                <span class="font-mono text-[10px] text-text-low">{{ s.model }} · 在线</span>
              </div>
            </div>
          </div>
          <div>
            <div class="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-low">通信链路状态</div>
            <div class="flex flex-col gap-1.5">
              <div v-for="c in comms" :key="c.name" class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2 text-text-mid">
                  <span class="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                  {{ c.name }}
                </span>
                <span class="font-mono text-[10px] text-success">{{ c.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </HudPanel>

      <!-- 运维操作 -->
      <HudPanel index="DEV.03" title="运维操作" status="none">
        <template #actions>
          <span class="font-mono text-[10px] text-text-low">{{ opMessage }}</span>
        </template>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            type="button"
            class="border border-line-strong bg-elevated px-3 py-2.5 text-xs font-medium text-text-hi transition-all hover:border-primary/60 hover:text-primary active:scale-95"
            @click="runOp('远程重启')"
          >
            ⟳ 远程重启
          </button>
          <button
            v-permission="'device:ota'"
            type="button"
            class="border border-primary bg-primary/15 px-3 py-2.5 text-xs font-semibold text-primary shadow-[0_0_12px_rgba(0,242,254,0.2)] transition-all hover:bg-primary/25 active:scale-95"
            @click="runOp('固件OTA升级')"
          >
            ⇪ 固件OTA升级
          </button>
          <button
            type="button"
            class="border border-line-strong bg-elevated px-3 py-2.5 text-xs font-medium text-text-hi transition-all hover:border-primary/60 hover:text-primary active:scale-95"
            @click="runOp('传感器标定')"
          >
            ⊹ 传感器标定
          </button>
          <button
            type="button"
            class="border border-line-strong bg-elevated px-3 py-2.5 text-xs font-medium text-text-hi transition-all hover:border-primary/60 hover:text-primary active:scale-95"
            @click="runOp('查看日志')"
          >
            ☰ 查看日志
          </button>
        </div>

        <!-- OTA 升级进度 -->
        <div class="mt-3 flex flex-col gap-2 border border-line/60 bg-container/60 p-3">
          <div class="flex items-center justify-between font-mono text-[11px]">
            <span class="text-text-mid">固件 v2.4.0 OTA 升级包传输中（差分包 46.8 MB）</span>
            <span class="text-primary">{{ otaProgress }}%</span>
          </div>
          <div class="relative h-2 w-full overflow-hidden bg-line/60">
            <div
              class="h-full bg-gradient-to-r from-primary to-success opacity-90 shadow-[0_0_8px_rgba(0,242,254,0.5)]"
              :style="{ width: otaProgress + '%' }"
            />
          </div>
          <div class="flex justify-between font-mono text-[10px] text-text-low">
            <span>校验通道 AES-256 · 断点续传已启用</span>
            <span class="text-success">链路稳定</span>
          </div>
        </div>
      </HudPanel>
    </section>
  </div>
</template>
