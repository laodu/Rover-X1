<script setup lang="ts">
withDefaults(
  defineProps<{
    index?: string
    title: string
    status?: 'online' | 'degraded' | 'lost' | 'none'
  }>(),
  { index: '', status: 'none' },
)

const statusColor: Record<string, string> = {
  online: 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.9)]',
  degraded: 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.9)]',
  lost: 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.9)]',
}
</script>

<template>
  <section class="stream-line relative border border-info/15 bg-panel/70 backdrop-blur-md">
    <!-- 四角机械括号 -->
    <span class="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-primary/60" />
    <span class="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-primary/60" />
    <span class="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-primary/60" />
    <span class="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-primary/60" />

    <header class="flex items-center gap-2 border-b border-line px-3 py-2">
      <span v-if="status !== 'none'" class="h-1.5 w-1.5 rounded-full" :class="statusColor[status]" />
      <span v-if="index" class="font-mono text-[10px] uppercase tracking-wider text-text-low">{{ index }}</span>
      <h3 class="font-headline text-sm font-semibold tracking-wide text-text-hi">{{ title }}</h3>
      <div class="flex-1" />
      <slot name="actions" />
    </header>

    <div class="p-3">
      <slot />
    </div>
  </section>
</template>
