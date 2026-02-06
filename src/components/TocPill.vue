<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface StageInfo {
  id: string
  title: string
}

const props = defineProps<{
  stages: StageInfo[]
  hasCookLog: boolean
  hasChangeLog: boolean
  currentStageId: string | null
  completedStageIds: string[]
  inHeader?: boolean // When true, renders compact for header placement
}>()

const emit = defineEmits<{
  navigate: [target: string]
}>()

const isOpen = ref(false)
const pillRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

// Current stage display info
const currentStage = computed(() => {
  if (!props.currentStageId) return props.stages[0] ?? null
  return props.stages.find(s => s.id === props.currentStageId) ?? null
})

// Progress text for pill (e.g., "2/4")
const progressText = computed(() => {
  const completed = props.completedStageIds.length
  const total = props.stages.length
  return `${completed}/${total}`
})

// Pill display text
const pillText = computed(() => {
  if (!currentStage.value) return 'Recipe'
  return `${currentStage.value.title} · ${progressText.value}`
})

function toggleDropdown(): void {
  isOpen.value = !isOpen.value
}

function handleNavigate(target: string): void {
  emit('navigate', target)
  isOpen.value = false
}

function isStageCompleted(stageId: string): boolean {
  return props.completedStageIds.includes(stageId)
}

function isCurrentStage(stageId: string): boolean {
  return props.currentStageId === stageId
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as Node
  if (
    pillRef.value &&
    dropdownRef.value &&
    !pillRef.value.contains(target) &&
    !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

// Close on escape key
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative" :class="inHeader ? '' : 'my-4'">
    <!-- Pill Button -->
    <button
      ref="pillRef"
      @click="toggleDropdown"
      class="inline-flex items-center gap-2 px-3 py-1.5 bg-ink text-white text-xs font-medium cursor-pointer transition-colors hover:bg-stone-700"
      :class="inHeader ? 'rounded-sm' : 'rounded-full shadow-md'"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <span class="whitespace-nowrap">{{ pillText }}</span>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        class="transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      >
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute top-full mt-2 right-0 min-w-[180px] bg-white border-2 border-ink shadow-lg z-50"
        role="menu"
      >
        <!-- Stages List -->
        <div class="py-1">
          <button
            v-for="stage in stages"
            :key="stage.id"
            @click="handleNavigate(stage.id)"
            class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-stone-100"
            :class="{
              'text-accent font-semibold': isCurrentStage(stage.id),
              'text-green-600': isStageCompleted(stage.id) && !isCurrentStage(stage.id)
            }"
            role="menuitem"
          >
            <span class="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <svg
                v-if="isStageCompleted(stage.id)"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2.5 7L5.5 10L11.5 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span>{{ stage.title }}</span>
          </button>
        </div>

        <!-- Separator and Additional Sections -->
        <template v-if="hasCookLog || hasChangeLog">
          <div class="h-px bg-stone-200 mx-2" />

          <div class="py-1">
            <button
              v-if="hasCookLog"
              @click="handleNavigate('cook-log')"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-stone-100"
              role="menuitem"
            >
              <span class="w-4 h-4" />
              <span>Cook Log</span>
            </button>

            <button
              v-if="hasChangeLog"
              @click="handleNavigate('change-log')"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-stone-100"
              role="menuitem"
            >
              <span class="w-4 h-4" />
              <span>Version History</span>
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
