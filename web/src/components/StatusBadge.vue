<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string
    tone?: 'online' | 'active' | 'hazard' | 'danger' | 'muted'
  }>(),
  { tone: 'muted' },
)

const styles: Record<string, { dot: string; pill: string }> = {
  online: { dot: 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]', pill: 'bg-success/10 text-success' },
  active: { dot: 'bg-primary shadow-[0_0_6px_rgba(0,242,254,0.9)]', pill: 'bg-primary/10 text-primary' },
  hazard: { dot: 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.9)]', pill: 'bg-warning/15 text-warning' },
  danger: { dot: 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.9)]', pill: 'bg-danger/15 text-danger' },
  muted: { dot: 'bg-text-low', pill: 'bg-line/60 text-text-mid' },
}
</script>

<template>
  <span
    class="inline-flex h-[22px] items-center gap-1.5 px-2 font-mono text-[10px] font-medium uppercase tracking-wide"
    :class="styles[props.tone].pill"
  >
    <span class="h-1 w-1 rounded-full" :class="styles[props.tone].dot" />
    {{ text }}
  </span>
</template>
