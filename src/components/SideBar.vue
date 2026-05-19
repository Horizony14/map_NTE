<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useMarkerStore } from '@/stores/markerStore'
import { MARKER_TYPE_CONFIG, MARKER_CATEGORIES } from '@/types'
import type { MarkerType } from '@/types'
import { EDITOR_ENABLED, resolveAssetUrl } from '@/config'

const store = useMarkerStore()

const detailScrollRef = ref<HTMLElement | null>(null)
const maxDescLines = ref(3)

let ro: ResizeObserver | null = null

function recalcLines() {
  const el = detailScrollRef.value
  if (!el) return
  const h = el.clientHeight
  if (window.innerWidth < 768) {
    const cardH = (h - 8) / 2
    const overhead = 24 + 64 + 12 + 20 + 4
    maxDescLines.value = Math.max(1, Math.floor((cardH - overhead) / 16))
  } else {
    maxDescLines.value = 3
  }
}

onMounted(() => {
  ro = new ResizeObserver(() => recalcLines())
  if (detailScrollRef.value) ro.observe(detailScrollRef.value)
})

onUnmounted(() => {
  ro?.disconnect()
})

const markerTypes = Object.keys(MARKER_TYPE_CONFIG) as MarkerType[]

const allSelected = computed(() => markerTypes.every((t) => store.selectedTypes.has(t)))
const noneSelected = computed(() => markerTypes.every((t) => !store.selectedTypes.has(t)))

const detailType = ref<MarkerType | null>(null)
const searchExpanded = ref(false)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const searchInput = ref<HTMLInputElement | null>(null)

function toggleSearch() {
  searchExpanded.value = !searchExpanded.value
  if (!searchExpanded.value) {
    store.searchQuery = ''
  }
}

function showToast(msg: string) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2000)
}

async function handleToggleEditorMode() {
  const willEnable = !store.isEditorMode
  await store.toggleEditorMode()
  showToast(willEnable ? '编辑者模式已开启' : '编辑者模式已关闭')
}

watch(searchExpanded, (val) => {
  if (val) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

function categoryAllSelected(types: MarkerType[]): boolean {
  return types.every((t) => store.selectedTypes.has(t))
}
function categoryAnySelected(types: MarkerType[]): boolean {
  return types.some((t) => store.selectedTypes.has(t))
}
function toggleCategory(types: MarkerType[]) {
  if (categoryAllSelected(types)) {
    for (const t of types) store.selectedTypes.delete(t)
  } else {
    for (const t of types) store.selectedTypes.add(t)
  }
}

const flatVisibleTypes = computed(() => {
  const result: { type: MarkerType; foundCount: number; totalCount: number }[] = []
  for (const cat of MARKER_CATEGORIES) {
    for (const type of cat.types) {
      if (!store.selectedTypes.has(type)) continue
      const stats = store.typeStats[type]
      if (stats.total > 0) {
        result.push({ type, foundCount: stats.found, totalCount: stats.total })
      }
    }
  }
  return result
})

const detailMarkers = computed(() => {
  if (!detailType.value) return []
  return store.filteredMarkers.filter((m) => m.type === detailType.value)
})

function showDetail(type: MarkerType) {
  detailType.value = type
}

function backToList() {
  detailType.value = null
}

function scrollToList(id: string) {
  store.selectMarker(id)
}
</script>

<template>
  <!-- Mobile open button (visible when sidebar closed) -->
  <button
    v-if="!store.sidebarOpen"
    @click="store.sidebarOpen = true"
    class="fixed bottom-6 left-6 z-30 w-10 h-10 rounded-xl bg-surface-800/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all md:hidden"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Backdrop (mobile) -->
  <Transition name="fade">
    <div
      v-if="store.sidebarOpen"
      class="fixed inset-0 z-20 bg-black/40 md:hidden"
      @click="store.sidebarOpen = false"
    ></div>
  </Transition>

  <!-- Floating panel -->
  <Transition name="slide">
    <div
      v-if="store.sidebarOpen"
      class="fixed z-50 flex flex-col bg-surface-900/95 backdrop-blur-xl border border-white/10 shadow-2xl inset-x-0 bottom-0 h-[38vh] rounded-t-2xl md:h-auto md:top-3 md:bottom-3 md:left-3 md:inset-x-auto md:w-[300px] md:rounded-2xl md:overflow-hidden"
    >
      <!-- Mobile close button (at top edge of panel) -->
      <button
        @click="store.sidebarOpen = false"
        class="absolute left-4 z-30 w-9 h-9 rounded-lg bg-surface-800/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all md:hidden"
        style="top: -1.5rem;"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Fixed top section -->
      <div class="flex-shrink-0 p-4 pb-2 space-y-3">
        <!-- Header + Search + Editor -->
        <div class="flex items-center gap-2">
          <h1 v-if="!searchExpanded" class="text-lg font-bold tracking-wide text-primary-400 select-none whitespace-nowrap truncate">
            异环 大地图
          </h1>
          <div v-if="searchExpanded" class="relative flex-1 min-w-0">
            <svg
              class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="store.searchQuery"
              type="text"
              placeholder="搜索..."
              ref="searchInput"
              class="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-800 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <button
              @click="toggleSearch()"
              class="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="关闭"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-else class="flex-1 min-w-0" />
          <button
            v-if="!searchExpanded"
            @click="toggleSearch()"
            class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            title="搜索"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            v-if="EDITOR_ENABLED"
            @click="handleToggleEditorMode()"
            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            :class="store.isEditorMode ? 'text-primary-400 bg-primary-500/15' : 'text-slate-400 hover:text-white hover:bg-white/10'"
            title="编辑者模式"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        <!-- Toast -->
        <Transition name="toast">
          <div
            v-if="toast"
            class="absolute top-3 left-4 right-4 z-30 px-4 py-3 text-sm font-medium text-center rounded-xl shadow-2xl pointer-events-none"
            :class="store.isEditorMode ? 'text-primary-200 bg-primary-600/80 border border-primary-400/40' : 'text-slate-200 bg-surface-700/95 border border-white/10'"
          >
            {{ toast }}
          </div>
        </Transition>
      </div>

      <!-- Scrollable area -->
      <div v-if="detailType === null" class="flex-1 overflow-y-auto overflow-hidden px-4 pb-4 space-y-3">
        <!-- Type filters -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">分类筛选</span>
            <div class="flex gap-2">
              <button
                @click="store.selectAllTypes()"
                class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                :class="{ 'opacity-50': allSelected }"
              >
                全选
              </button>
              <button
                @click="store.deselectAllTypes()"
                class="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                :class="{ 'opacity-50': noneSelected }"
              >
                反选
              </button>
            </div>
          </div>
          <div class="space-y-2 max-md:flex max-md:gap-2 max-md:overflow-x-auto max-md:pb-1 max-md:space-y-0">
            <div v-for="cat in MARKER_CATEGORIES" :key="cat.label" class="flex items-start gap-1.5 max-md:flex-shrink-0 max-md:bg-white/5 max-md:rounded-lg max-md:px-2.5 max-md:py-1.5 max-md:flex-col max-md:gap-1 max-md:min-w-[100px]">
              <button
                @click="toggleCategory(cat.types)"
                class="text-xs font-medium pt-0.5 w-10 flex-shrink-0 text-right transition-colors max-md:w-auto max-md:text-left max-md:pt-0 max-md:text-[11px]"
                :class="categoryAllSelected(cat.types) ? 'text-slate-200' : categoryAnySelected(cat.types) ? 'text-slate-400' : 'text-slate-600'"
              >{{ cat.label }}</button>
              <div class="flex flex-wrap gap-1 flex-1 max-md:flex-nowrap">
                <button
                  v-for="type in cat.types"
                  :key="type"
                  @click="store.toggleType(type)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all"
                  :class="
                    store.selectedTypes.has(type)
                      ? 'border-current text-white'
                      : 'border-white/10 text-slate-500 bg-transparent'
                  "
                  :style="store.selectedTypes.has(type) ? { backgroundColor: MARKER_TYPE_CONFIG[type].color + '33', borderColor: MARKER_TYPE_CONFIG[type].color + '66' } : {}"
                >
                  <img
                    :src="resolveAssetUrl(MARKER_TYPE_CONFIG[type].iconUrl)"
                    :alt="MARKER_TYPE_CONFIG[type].label"
                    class="w-3.5 h-3.5 rounded-full object-cover"
                  />
                  {{ MARKER_TYPE_CONFIG[type].label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Display mode + Reset -->
        <div class="flex items-center justify-between">
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">显示模式</span>
            <span class="text-xs text-slate-500">仅未收集</span>
            <div class="relative">
              <input
                type="checkbox"
                :checked="store.filterMode === 'unfound'"
                @change="store.filterMode = store.filterMode === 'unfound' ? 'all' : 'unfound'"
                class="sr-only peer"
              />
              <div
                class="w-8 h-4 bg-surface-700 rounded-full peer-checked:bg-primary-600 transition-colors"
              ></div>
              <div
                class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform"
                :class="store.filterMode === 'unfound' ? 'translate-x-4' : ''"
              ></div>
            </div>
          </label>
          <button
            @click="store.resetProgress()"
            class="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            重置收集进度
          </button>
        </div>

        <!-- Results count -->
        <div class="text-xs text-slate-500 pt-1 border-t border-white/5">
          <span>共 {{ store.filteredMarkers.length }} 个标记点</span>
        </div>

        <!-- Flat type list -->
        <div class="max-md:flex max-md:gap-2 max-md:overflow-x-auto max-md:pb-1">
          <template v-for="item in flatVisibleTypes" :key="item.type">
            <div
              @click="showDetail(item.type)"
              class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 select-none -mx-4 max-md:flex-shrink-0 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:py-1.5 max-md:mx-0 max-md:rounded-lg max-md:bg-white/5 max-md:border-b-0 max-md:min-w-[60px] max-md:text-center max-md:hover:bg-white/10"
            >
              <img
                :src="resolveAssetUrl(MARKER_TYPE_CONFIG[item.type].iconUrl)"
                :alt="MARKER_TYPE_CONFIG[item.type].label"
                class="w-[18px] h-[18px] rounded-full object-cover flex-shrink-0 max-md:w-6 max-md:h-6"
              />
              <span class="flex-1 text-sm text-slate-200 truncate max-md:text-xs max-md:flex-initial">{{ MARKER_TYPE_CONFIG[item.type].label }}</span>
              <span
                class="text-xs font-mono flex-shrink-0"
                :class="item.foundCount === item.totalCount && item.totalCount > 0 ? 'text-green-400' : 'text-slate-500'"
              >
                {{ item.foundCount }}/{{ item.totalCount }}
              </span>
              <svg
                class="w-3.5 h-3.5 text-slate-500 flex-shrink-0 max-md:hidden"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </template>

          <div v-if="flatVisibleTypes.length === 0" class="flex items-center justify-center gap-2 text-slate-500 py-2.5 max-md:min-h-[72px] max-md:min-w-[60px] max-md:flex-shrink-0 max-md:flex-col max-md:py-1.5 max-md:rounded-lg max-md:bg-white/5">
            <svg class="w-8 h-8 opacity-30 max-md:w-8 max-md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-xs">无匹配</span>
          </div>
        </div>
      </div>

      <!-- Detail overlay -->
      <div
        v-if="detailType !== null"
        class="flex-1 flex flex-col overflow-hidden"
      >
        <!-- Back button + type header -->
        <div class="flex-shrink-0 flex items-center gap-2.5 px-4 py-1.5 border-b border-white/10 bg-surface-800/80">
          <button
            @click="backToList()"
            class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors flex-shrink-0"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            :src="resolveAssetUrl(MARKER_TYPE_CONFIG[detailType].iconUrl)"
            :alt="MARKER_TYPE_CONFIG[detailType].label"
            class="w-4 h-4 rounded-full object-cover flex-shrink-0"
          />
          <span class="flex-1 text-sm leading-none font-medium text-slate-200 truncate">{{ MARKER_TYPE_CONFIG[detailType].label }}</span>
          <span class="text-xs leading-none font-mono text-slate-500 flex-shrink-0">
            {{ store.typeStats[detailType].found }}/{{ store.typeStats[detailType].total }}
          </span>
        </div>

        <!-- Marker cards -->
        <div ref="detailScrollRef" class="flex-1 overflow-y-auto px-4 pb-4 space-y-2 pt-3 max-md:grid max-md:grid-rows-2 max-md:grid-flow-col max-md:gap-2 max-md:space-y-0 max-md:overflow-x-auto max-md:overflow-y-hidden">
          <div
            v-for="m in detailMarkers"
            :key="m.id"
            @click="scrollToList(m.id)"
            class="flex gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors border border-white/5 max-md:w-[260px] max-md:flex-shrink-0 max-md:overflow-hidden max-md:h-full"
            :class="{ 'bg-primary-500/10 border-primary-500/30': store.selectedMarkerId === m.id }"
          >
            <!-- Image -->
            <div v-if="m.image || (m.images && m.images.length > 0)" class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-800">
              <img
                :src="m.image ? resolveAssetUrl(m.image) : (m.images && m.images[0] ? resolveAssetUrl(m.images[0]) : undefined)"
                :alt="m.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-16 h-16 rounded-lg flex-shrink-0 bg-surface-800 flex items-center justify-center">
              <img
                :src="resolveAssetUrl(MARKER_TYPE_CONFIG[m.type].iconUrl)"
                :alt="MARKER_TYPE_CONFIG[m.type].label"
                class="w-8 h-8 rounded-full object-cover opacity-50"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium truncate" :class="store.isFound(m.id) ? 'text-slate-500 line-through' : 'text-slate-200'">
                  {{ m.name }}
                </span>
                <span
                  v-if="store.isFound(m.id)"
                  class="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex-shrink-0"
                >已标记</span>
              </div>
              <div
                v-if="m.description"
                class="text-xs text-slate-500 mt-1 overflow-hidden"
                :style="{ display: '-webkit-box', '-webkit-box-orient': 'vertical', '-webkit-line-clamp': maxDescLines }"
              >
                {{ m.description }}
              </div>
            </div>

            <svg v-if="store.selectedMarkerId === m.id" class="w-4 h-4 text-primary-400 flex-shrink-0 self-center max-md:hidden" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </div>

          <div v-if="detailMarkers.length === 0" class="flex items-center justify-center gap-2 text-slate-500 max-md:row-span-2 max-md:w-[160px] max-md:flex-col max-md:rounded-xl max-md:bg-white/5 max-md:border max-md:border-white/5">
            <svg class="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="text-xs">无匹配</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
@media (min-width: 768px) {
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(-100%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
