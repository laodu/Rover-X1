<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import HudPanel from '../components/HudPanel.vue'
import StatusBadge from '../components/StatusBadge.vue'

/* ---------- 视频通道 ---------- */
interface Channel {
  id: string
  name: string
  robot: string
  latency: number
  extra: string
  thermal?: boolean
}

const channels: Channel[] = [
  { id: 'CH-01', name: '前置双目相机', robot: 'Rover-01', latency: 12, extra: '状态：稳定传输' },
  { id: 'CH-02', name: '后置相机', robot: 'Rover-01', latency: 18, extra: '状态：备用在线' },
  { id: 'CH-03', name: '红外热成像', robot: 'Rover-01', latency: 15, extra: '核心温度：38.2℃', thermal: true },
  { id: 'CH-04', name: '前置相机', robot: 'Rover-02', latency: 14, extra: '状态：待命巡检' },
]

const selectedChannel = ref(channels[0].id)
const activeChannel = computed(() => channels.find((c) => c.id === selectedChannel.value) ?? channels[0])

const thumbnails = [
  { name: '足底广角', fps: 30, latency: 14 },
  { name: '机械臂特写', fps: 30, latency: 16 },
  { name: '云台侧视', fps: 30, latency: 15 },
  { name: '全景雷达', fps: 60, latency: 9 },
]

/* ---------- REC 时间码 ---------- */
const now = ref(new Date())
const timecode = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
)

/* ---------- 主画面坐标（模拟漂移） ---------- */
const coord = ref({ x: 124.36, y: 87.12, z: 0.42 })

/* ---------- 方向与速度 ---------- */
const directions = [
  { key: 'fl', label: '◤' },
  { key: 'f', label: '▲' },
  { key: 'fr', label: '◥' },
  { key: 'l', label: '◀' },
  { key: 'stop', label: '■' },
  { key: 'r', label: '▶' },
  { key: 'bl', label: '◣' },
  { key: 'b', label: '▼' },
  { key: 'br', label: '◢' },
]
const activeDirection = ref('stop')
const speed = ref(1.2)

/* ---------- 姿态 / 灯光 / 喊话 ---------- */
const postures = [
  { key: 'stand', label: '站立' },
  { key: 'crouch', label: '趴下' },
  { key: 'wheel', label: '轮式模式' },
  { key: 'leg', label: '足式模式' },
]
const activePosture = ref('stand')

const ledColors = [
  { key: 'cyan', color: '#00f2fe' },
  { key: 'blue', color: '#38bdf8' },
  { key: 'green', color: '#10b981' },
  { key: 'purple', color: '#a78bfa' },
  { key: 'amber', color: '#f59e0b' },
  { key: 'red', color: '#ef4444' },
]
const activeLed = ref('cyan')

const broadcasting = ref(false)

/* ---------- 实时遥测（本地模拟） ---------- */
const telemetry = ref({ battery: 76, roll: 1.2, pitch: -0.4, yaw: 84, temp: 38.2 })

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
    const t = telemetry.value
    t.roll = +(t.roll + (Math.random() - 0.5) * 0.2).toFixed(1)
    t.pitch = +(t.pitch + (Math.random() - 0.5) * 0.2).toFixed(1)
    t.yaw = Math.round((t.yaw + (Math.random() - 0.5) * 1.4 + 360) % 360)
    t.temp = +(38.2 + (Math.random() - 0.5) * 0.6).toFixed(1)
    coord.value.x = +(coord.value.x + (Math.random() - 0.5) * 0.06).toFixed(2)
    coord.value.y = +(coord.value.y + (Math.random() - 0.5) * 0.06).toFixed(2)
    coord.value.z = +(0.42 + (Math.random() - 0.5) * 0.04).toFixed(2)
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const yawText = computed(() => String(telemetry.value.yaw).padStart(3, '0'))
const fmt = (n: number) => (n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1))

function pressDirection(key: string) {
  activeDirection.value = key
}

function emergencyStop() {
  activeDirection.value = 'stop'
  speed.value = 0
}
</script>

<template>
  <div class="flex h-full min-h-[760px] gap-4">
    <!-- 左栏：视频通道列表 -->
    <div class="w-[300px] shrink-0">
      <HudPanel index="SYS.01" title="视频通道列表" status="online" class="h-full">
        <template #actions>
          <StatusBadge text="4 通道在线" tone="active" />
        </template>

        <div class="space-y-2">
          <button
            v-for="ch in channels"
            :key="ch.id"
            class="w-full border px-3 py-2.5 text-left transition-colors"
            :class="
              selectedChannel === ch.id
                ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                : 'border-line bg-container/40 hover:border-info/40'
            "
            @click="selectedChannel = ch.id"
          >
            <div class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              <span class="text-sm font-medium text-text-hi">{{ ch.robot }} {{ ch.name }}</span>
              <span class="flex-1" />
              <span class="font-mono text-[10px] text-text-low">{{ ch.id }}</span>
            </div>
            <div class="mt-1.5 flex items-center justify-between font-mono text-[10px]">
              <span :class="ch.thermal ? 'text-danger' : 'text-text-mid'">
                {{ ch.thermal ? 'THERMAL @ 30Hz' : '1080P @ 30FPS' }}
              </span>
              <span class="text-primary">{{ ch.latency }}ms</span>
            </div>
            <div class="mt-1 flex items-center justify-between text-[11px]">
              <span class="text-text-low">{{ ch.extra }}</span>
              <span :class="selectedChannel === ch.id ? 'text-primary' : 'text-text-low'">
                {{ selectedChannel === ch.id ? '主画面激活' : '点击切换' }}
              </span>
            </div>
          </button>
        </div>
      </HudPanel>
    </div>

    <!-- 中栏：主视频区 + 缩略视频墙 -->
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <HudPanel index="SYS.02" :title="`实时巡检画面 · ${activeChannel.robot} ${activeChannel.name}`" status="online" class="flex-1">
        <template #actions>
          <span class="font-mono text-[10px] uppercase tracking-wider text-text-low">{{ activeChannel.id }} 实时直连</span>
        </template>

        <!-- 主画面 -->
        <div class="relative aspect-video w-full overflow-hidden border border-line bg-canvas">
          <!-- 夜视渐变 + 网格 -->
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,60,80,0.55)_0%,rgba(7,11,20,0.95)_75%)]" />
          <div
            class="absolute inset-0 opacity-40"
            style="
              background-image:
                linear-gradient(rgba(0, 242, 254, 0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 242, 254, 0.06) 1px, transparent 1px);
              background-size: 28px 28px;
            "
          />
          <div class="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,242,254,0.05)_50%,transparent_100%)]" />

          <!-- 中心瞄准十字线 -->
          <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div class="relative h-24 w-24 border border-primary/40">
              <span class="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/70" />
              <span class="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 bg-primary/70" />
              <span class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary" />
            </div>
          </div>

          <!-- 四角取景框括号 -->
          <span class="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-primary/70" />
          <span class="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-primary/70" />
          <span class="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-primary/70" />
          <span class="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-primary/70" />

          <!-- 左上：REC + 时间码 -->
          <div class="absolute left-4 top-4 flex items-center gap-2 font-mono text-xs">
            <span class="flex items-center gap-1.5 font-bold tracking-wider text-danger">
              <span class="h-2 w-2 animate-pulse rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
              REC
            </span>
            <span class="text-text-hi tabular-nums">{{ timecode }}</span>
          </div>

          <!-- 右上：FPS / 延迟 -->
          <div class="absolute right-4 top-4 flex items-center gap-3 font-mono text-xs text-text-mid">
            <span>FPS <span class="text-text-hi tabular-nums">30</span></span>
            <span class="text-line-strong">|</span>
            <span>延迟 <span class="text-primary tabular-nums">{{ activeChannel.latency }}ms</span></span>
          </div>

          <!-- 左下：坐标 -->
          <div class="absolute bottom-4 left-4 font-mono text-xs text-text-mid tabular-nums">
            <span class="text-text-low">X</span> <span class="text-primary">{{ coord.x.toFixed(2) }}</span>
            <span class="ml-2 text-text-low">Y</span> <span class="text-primary">{{ coord.y.toFixed(2) }}</span>
            <span class="ml-2 text-text-low">Z</span> <span class="text-primary">{{ coord.z.toFixed(2) }}</span>
          </div>

          <!-- 右下：AI 识别信息 -->
          <div class="absolute bottom-4 right-4 text-right font-mono text-[10px] leading-relaxed text-text-mid">
            <div>目标距离：14.2m ｜ 识别置信度：99.4%</div>
            <div class="text-primary">区域巡检：工业园区 B区-主管道</div>
          </div>
        </div>

        <!-- 画面操作 -->
        <div class="mt-3 flex items-center justify-between">
          <div class="font-mono text-[10px] uppercase tracking-wider text-text-low">
            夜视增强：开启 ｜ 码流：主码流 H.265 ｜ 加密：TLS 1.3
          </div>
          <div class="flex gap-2">
            <button class="border border-line-strong bg-elevated px-3 py-1.5 text-xs text-text-mid transition-colors hover:border-primary/50 hover:text-primary">
              全屏监控
            </button>
            <button class="border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20">
              抓拍存档
            </button>
          </div>
        </div>
      </HudPanel>

      <!-- 四宫格缩略视频墙 -->
      <div class="grid shrink-0 grid-cols-2 gap-3">
        <div
          v-for="t in thumbnails"
          :key="t.name"
          class="relative aspect-[16/7] overflow-hidden border border-line bg-canvas"
        >
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,50,70,0.6)_0%,rgba(7,11,20,0.95)_80%)]" />
          <div
            class="absolute inset-0 opacity-30"
            style="
              background-image:
                linear-gradient(rgba(0, 242, 254, 0.07) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 242, 254, 0.07) 1px, transparent 1px);
              background-size: 20px 20px;
            "
          />
          <span class="absolute left-2 top-2 bg-black/60 px-1.5 py-0.5 text-[11px] text-primary">{{ t.name }}</span>
          <span class="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-text-mid tabular-nums">
            FPS: {{ t.fps }} | {{ t.latency }}ms
          </span>
          <span class="absolute bottom-2 left-2 flex items-center gap-1 font-mono text-[10px] text-success">
            <span class="h-1 w-1 rounded-full bg-success" /> LIVE
          </span>
        </div>
      </div>
    </div>

    <!-- 右栏：远程操控 -->
    <div class="flex w-[320px] shrink-0 flex-col gap-4">
      <!-- 方向控制 -->
      <HudPanel index="SYS.03" title="方向控制" status="online">
        <div class="mx-auto grid w-[168px] grid-cols-3 gap-1.5">
          <button
            v-for="d in directions"
            :key="d.key"
            class="flex h-12 items-center justify-center border font-mono text-base transition-colors"
            :class="
              d.key === 'stop'
                ? 'border-danger/60 bg-danger/15 text-danger hover:bg-danger/25'
                : activeDirection === d.key
                  ? 'border-primary/70 bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                  : 'border-line-strong bg-elevated/60 text-text-mid hover:border-primary/50 hover:text-primary'
            "
            @click="pressDirection(d.key)"
          >
            {{ d.label }}
          </button>
        </div>

        <!-- 速度滑块 -->
        <div class="mt-4">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-xs text-text-mid">巡检速度</span>
            <span class="font-mono text-sm font-bold text-primary tabular-nums">{{ speed.toFixed(1) }} m/s</span>
          </div>
          <input v-model.number="speed" type="range" min="0" max="3" step="0.1" class="hud-range w-full" />
          <div class="mt-1 flex justify-between font-mono text-[10px] text-text-low tabular-nums">
            <span>0.0</span>
            <span>1.5</span>
            <span>3.0</span>
          </div>
        </div>
      </HudPanel>

      <!-- 姿态控制 -->
      <HudPanel index="SYS.04" title="姿态控制" status="online">
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="p in postures"
            :key="p.key"
            class="border px-3 py-2 text-sm transition-colors"
            :class="
              activePosture === p.key
                ? 'border-primary/70 bg-primary/15 text-primary shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                : 'border-line-strong bg-elevated/60 text-text-mid hover:border-primary/50 hover:text-text-hi'
            "
            @click="activePosture = p.key"
          >
            {{ p.label }}
          </button>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span class="text-xs text-text-mid">LED 灯光</span>
          <div class="flex gap-2">
            <button
              v-for="led in ledColors"
              :key="led.key"
              class="h-5 w-5 rounded-full transition-transform hover:scale-110"
              :class="activeLed === led.key ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-panel' : 'opacity-60'"
              :style="{ backgroundColor: led.color, boxShadow: `0 0 8px ${led.color}` }"
              @click="activeLed = led.key"
            />
          </div>
        </div>

        <button
          class="mt-3 flex w-full items-center justify-center gap-2 border py-2 text-sm transition-colors"
          :class="
            broadcasting
              ? 'border-warning/70 bg-warning/15 text-warning'
              : 'border-line-strong bg-elevated/60 text-text-mid hover:border-primary/50 hover:text-primary'
          "
          @click="broadcasting = !broadcasting"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="broadcasting ? 'animate-pulse bg-warning' : 'bg-text-low'" />
          {{ broadcasting ? '喊话中… 点击结束' : '语音喊话' }}
        </button>
      </HudPanel>

      <!-- 紧急控制区 -->
      <section class="stream-line relative border border-danger/50 bg-danger/5 p-3 backdrop-blur-md">
        <div class="mb-2.5 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-danger shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
          <h3 class="font-headline text-sm font-semibold tracking-wide text-danger">紧急控制区</h3>
          <span class="flex-1" />
          <span class="font-mono text-[10px] uppercase tracking-wider text-danger/70">EMERGENCY</span>
        </div>
        <button
          v-permission="'control:emergency'"
          class="pulse-danger w-full border border-danger bg-danger/30 py-2.5 font-headline text-sm font-bold tracking-widest text-white transition-colors hover:bg-danger/40"
          @click="emergencyStop"
        >
          紧急制动
        </button>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button v-permission="'control:emergency'" class="border border-warning/60 bg-warning/10 py-1.5 text-xs text-warning transition-colors hover:bg-warning/20">
            人工接管
          </button>
          <button class="border border-line-strong bg-elevated/60 py-1.5 text-xs text-text-mid transition-colors hover:border-primary/50 hover:text-primary">
            一键返航
          </button>
        </div>
      </section>

      <!-- 实时遥测 -->
      <HudPanel index="SYS.05" title="实时遥测" status="online" class="flex-1">
        <div class="space-y-3 font-mono text-xs tabular-nums">
          <div>
            <div class="mb-1 flex items-center justify-between">
              <span class="font-body text-text-mid">主电池电量</span>
              <span class="text-sm font-bold" :class="telemetry.battery > 30 ? 'text-success' : 'text-danger'">
                {{ telemetry.battery }}%
              </span>
            </div>
            <div class="h-1.5 w-full bg-line/60">
              <div
                class="h-full transition-all duration-500"
                :class="telemetry.battery > 30 ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-danger'"
                :style="{ width: `${telemetry.battery}%` }"
              />
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-line pt-2.5">
            <span class="font-body text-text-mid">姿态角 Roll / Pitch / Yaw</span>
            <span class="text-success">OK</span>
          </div>
          <div class="text-base font-bold text-text-hi">
            {{ fmt(telemetry.roll) }}° / {{ fmt(telemetry.pitch) }}° / {{ yawText }}°
          </div>

          <div class="flex items-center justify-between border-t border-line pt-2.5">
            <span class="font-body text-text-mid">当前速度</span>
            <span class="text-base font-bold text-primary">{{ speed.toFixed(1) }} <span class="text-[10px] text-text-low">m/s</span></span>
          </div>

          <div class="flex items-center justify-between border-t border-line pt-2.5">
            <span class="font-body text-text-mid">电机温度</span>
            <span class="text-base font-bold" :class="telemetry.temp > 45 ? 'text-danger' : 'text-text-hi'">
              {{ telemetry.temp.toFixed(1) }} <span class="text-[10px] text-text-low">℃</span>
            </span>
          </div>
        </div>
      </HudPanel>
    </div>
  </div>
</template>

<style scoped>
.hud-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: linear-gradient(90deg, rgba(0, 242, 254, 0.5), rgba(0, 242, 254, 0.15));
  outline: none;
}
.hud-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #00f2fe;
  border: 2px solid #0a1124;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
  cursor: pointer;
}
.hud-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #00f2fe;
  border: 2px solid #0a1124;
  border-radius: 0;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
  cursor: pointer;
}
</style>
