<script setup lang="ts">
import { onMounted } from 'vue'
import { useMarkerStore } from './stores/markerStore'
import MapView from './components/MapView.vue'
import SideBar from './components/SideBar.vue'
import MarkerPopup from './components/MarkerPopup.vue'
import LegendPanel from './components/LegendPanel.vue'
import CreateMarkerForm from './components/CreateMarkerForm.vue'

const store = useMarkerStore()

onMounted(() => {
  store.loadLatestMarkers()
})
</script>

<template>
  <div class="app-shell relative h-screen w-screen overflow-hidden bg-[#010101]">
    <!-- Map (full screen) -->
    <MapView />

    <!-- Sidebar toggle button -->
    <button
      @click="store.toggleSidebar()"
      class="fixed z-30 w-9 h-9 rounded-lg bg-surface-800/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all top-4 max-md:hidden"
      :class="store.sidebarOpen ? 'left-[316px]' : 'left-4'"
    >
      <svg v-if="!store.sidebarOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Sidebar (overlay) -->
    <SideBar />

    <!-- Popup -->
    <MarkerPopup />

    <!-- Legend -->
    <LegendPanel />

    <!-- Create marker form -->
    <CreateMarkerForm />
  </div>
</template>

<style scoped>
.app-shell {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
}
</style>
