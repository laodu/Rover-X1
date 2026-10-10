<script setup lang="ts">
import roverImg from '../../assets/rover-x1-wheel.jpg'

withDefaults(defineProps<{ dim?: boolean }>(), { dim: false })
</script>

<template>
  <!-- Rover X1 Explorer 轮足版实拍图（取自宣传册 PDF） -->
  <div
    class="flex h-full w-full items-center justify-center"
    :class="dim ? 'opacity-40 saturate-50' : ''"
  >
    <img
      :src="roverImg"
      alt="Rover X1 Explorer 轮足版"
      class="h-full w-auto max-w-full object-contain"
      draggable="false"
    />
  </div>
</template>
