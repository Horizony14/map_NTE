<script setup lang="ts">
import { ref } from 'vue'
import { useMarkerStore } from '@/stores/markerStore'
import { MARKER_TYPE_CONFIG, MARKER_CATEGORIES } from '@/types'
import { resolveAssetUrl } from '@/config'

const store = useMarkerStore()
const expanded = ref(false)
</script>

<template>
  <div
    class="fixed bottom-6 right-6 z-20 select-none"
  >
    <!-- Toggle button -->
    <button
      @click="expanded = !expanded"
      class="w-10 h-10 rounded-xl bg-surface-800/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all"
      title="图例"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </button>

    <!-- Legend panel -->
    <Transition name="legend">
      <div
        v-if="expanded"
        class="absolute bottom-12 right-0 mb-2 w-48 rounded-xl bg-surface-800/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3 space-y-1.5"
      >
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">图例</div>
        <template v-for="cat in MARKER_CATEGORIES" :key="cat.label">
          <div class="text-[10px] font-medium text-slate-500 uppercase tracking-wider pt-1 mb-0.5">{{ cat.label }}</div>
          <div
            v-for="type in cat.types"
            :key="type"
            @click="store.toggleType(type)"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
            :class="{ 'opacity-50': !store.selectedTypes.has(type) }"
          >
            <img
              :src="resolveAssetUrl(MARKER_TYPE_CONFIG[type].iconUrl)"
              :alt="MARKER_TYPE_CONFIG[type].label"
              class="w-[18px] h-[18px] rounded-full object-cover"
            />
            <span class="text-xs text-slate-300 flex-1">{{ MARKER_TYPE_CONFIG[type].label }}</span>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.legend-enter-active,
.legend-leave-active {
  transition: all 0.2s ease;
}
.legend-enter-from,
.legend-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}
</style>
