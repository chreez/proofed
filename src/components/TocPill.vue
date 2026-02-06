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
  <div class="toc-pill-container">
    <!-- Floating Pill -->
    <button
      ref="pillRef"
      @click="toggleDropdown"
      class="toc-pill"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <span class="toc-pill-text">{{ pillText }}</span>
      <span
        class="toc-pill-chevron"
        :class="{ 'toc-pill-chevron--open': isOpen }"
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="toc-dropdown"
        role="menu"
      >
        <!-- Stages List -->
        <div class="toc-dropdown-section">
          <button
            v-for="stage in stages"
            :key="stage.id"
            @click="handleNavigate(stage.id)"
            class="toc-dropdown-item"
            :class="{
              'toc-dropdown-item--current': isCurrentStage(stage.id),
              'toc-dropdown-item--completed': isStageCompleted(stage.id)
            }"
            role="menuitem"
          >
            <span class="toc-dropdown-check">
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
            <span class="toc-dropdown-label">{{ stage.title }}</span>
          </button>
        </div>

        <!-- Separator and Additional Sections -->
        <template v-if="hasCookLog || hasChangeLog">
          <div class="toc-dropdown-separator" />

          <div class="toc-dropdown-section">
            <button
              v-if="hasCookLog"
              @click="handleNavigate('cook-log')"
              class="toc-dropdown-item"
              role="menuitem"
            >
              <span class="toc-dropdown-check" />
              <span class="toc-dropdown-label">Cook Log</span>
            </button>

            <button
              v-if="hasChangeLog"
              @click="handleNavigate('change-log')"
              class="toc-dropdown-item"
              role="menuitem"
            >
              <span class="toc-dropdown-check" />
              <span class="toc-dropdown-label">Version History</span>
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toc-pill-container {
  position: fixed;
  top: 4rem;
  right: 1rem;
  z-index: 5;
}

/* When header is scrolled (smaller), adjust position */
@media (min-width: 768px) {
  .toc-pill-container {
    right: calc((100vw - 48rem) / 2 + 1rem);
  }
}

.toc-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 12px;
  background: #1a1816;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toc-pill:hover {
  background: #2a2826;
}

.toc-pill:focus {
  outline: 2px solid #a65d45;
  outline-offset: 2px;
}

.toc-pill-text {
  white-space: nowrap;
}

.toc-pill-chevron {
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.toc-pill-chevron--open {
  transform: rotate(180deg);
}

.toc-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 180px;
  background: white;
  border: 2px solid #1a1816;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toc-dropdown-section {
  padding: 0.25rem 0;
}

.toc-dropdown-separator {
  height: 1px;
  background: #e8e4dc;
  margin: 0.25rem 0;
}

.toc-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  color: #1a1816;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.toc-dropdown-item:hover {
  background: #f5f3ef;
}

.toc-dropdown-item--current {
  color: #a65d45;
  font-weight: 600;
}

.toc-dropdown-item--completed {
  color: #6b8e4e;
}

.toc-dropdown-item--current.toc-dropdown-item--completed {
  color: #a65d45;
}

.toc-dropdown-check {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toc-dropdown-label {
  flex: 1;
}

/* Dropdown transition */
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
