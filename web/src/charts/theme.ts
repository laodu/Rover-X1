import type { EChartsCoreOption } from 'echarts/core'

export const CHART_COLORS = ['#00f2fe', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8', '#8b5cf6']

export function baseChartOption(): EChartsCoreOption {
  return {
    color: CHART_COLORS,
    textStyle: { fontFamily: 'JetBrains Mono, Noto Sans SC, monospace', color: '#94a3b8' },
    grid: { left: 8, right: 8, top: 24, bottom: 4, containLabel: true },
    tooltip: {
      backgroundColor: 'rgba(10, 17, 36, 0.92)',
      borderColor: 'rgba(0, 242, 254, 0.35)',
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    legend: {
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
  }
}

export const axisStyle = {
  axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.25)' } },
  axisLabel: { color: '#64748b', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.08)' } },
  axisTick: { show: false },
}
