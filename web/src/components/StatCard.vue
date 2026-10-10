<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    sub?: string
    tone?: 'primary' | 'success' | 'warning' | 'danger'
  }>(),
  { unit: '', sub: '', tone: 'primary' },
)

const toneText: Record<string, string> = {
  primary: 'text-primary glow-text',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}
</script>

<template>
  <div class="stream-line relative border border-info/15 bg-panel/70 px-3 py-2.5 backdrop-blur-md">
    <div class="font-mono text-[10px] uppercase tracking-widest text-text-low">{{ label }}</div>
    <div class="mt-1 flex items-baseline gap-1">
      <span class="font-mono text-2xl font-bold leading-none" :class="toneText[tone]">{{ value }}</span>
      <span v-if="unit" class="font-mono text-[10px] uppercase text-text-low">{{ unit }}</span>
    </div>
    <div v-if="sub" class="mt-1 text-xs text-text-mid">{{ sub }}</div>
  </div>
</template>
