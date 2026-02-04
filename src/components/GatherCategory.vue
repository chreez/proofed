<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CheckableItem from '@/components/CheckableItem.vue'

const props = defineProps<{
  title: string
  items: { id: string; label: string; detail?: string }[]
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
  stageId: string
}>()

// Manual expand override - user clicked badge to expand
const manuallyExpanded = ref(false)

const checkedItems = computed(() =>
  props.items.filter(item => props.progress.isItemChecked(item.id))
)

const uncheckedItems = computed(() =>
  props.items.filter(item => !props.progress.isItemChecked(item.id))
)

const allChecked = computed(() =>
  props.items.length > 0 && checkedItems.value.length === props.items.length
)

// Collapse only if all checked AND not manually expanded
const isCollapsed = computed(() => allChecked.value && !manuallyExpanded.value)

// Reset manual expand when items change (user unchecks something)
watch(allChecked, (newVal) => {
  if (!newVal) {
    manuallyExpanded.value = false
  }
})

// Contextual label
const toggleLabel = computed(() => allChecked.value ? 'Clear All' : 'Complete All')

function handleToggle(itemId: string) {
  props.progress.toggleItem(itemId, props.stageId)
}

function handleCompleteAllClick(event: Event) {
  event.preventDefault()

  if (allChecked.value) {
    // Clear all
    props.items.forEach(item => {
      if (props.progress.isItemChecked(item.id)) {
        props.progress.toggleItem(item.id, props.stageId)
      }
    })
    manuallyExpanded.value = false
  } else {
    // Complete all
    props.items.forEach(item => {
      if (!props.progress.isItemChecked(item.id)) {
        props.progress.toggleItem(item.id, props.stageId)
      }
    })
  }
}

function expand() {
  manuallyExpanded.value = true
}

function collapse() {
  manuallyExpanded.value = false
}
</script>

<template>
  <div class="mb-4 last:mb-0">
    <!-- Collapsed state -->
    <div
      v-if="isCollapsed"
      @click="expand"
      class="bg-stone-200 px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-stone-300 transition-all duration-200"
    >
      <span class="text-xs text-stone-600">{{ title }}</span>
      <span class="text-xs bg-ink text-white px-2 py-0.5">
        {{ items.length }}/{{ items.length }} ✓
      </span>
    </div>

    <!-- Expanded state -->
    <div v-else>
      <div class="flex justify-between items-center mb-2">
        <h5 class="text-xs text-stone-400 uppercase">{{ title }}</h5>
        <div class="flex items-center gap-2">
          <label
            @click="handleCompleteAllClick"
            class="flex items-center gap-1.5 text-xs cursor-pointer select-none"
            :class="allChecked ? 'text-stone-500 hover:text-danger' : 'text-stone-400 hover:text-stone-600'"
          >
            <input
              type="checkbox"
              :checked="allChecked"
              class="accent-ink pointer-events-none"
            >
            {{ toggleLabel }}
          </label>
          <!-- Collapse button when manually expanded -->
          <button
            v-if="allChecked && manuallyExpanded"
            @click="collapse"
            class="text-xs text-stone-400 hover:text-stone-600"
            title="Collapse"
          >
            ▲
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <!-- Unchecked items first -->
        <CheckableItem
          v-for="item in uncheckedItems"
          :key="item.id"
          :id="item.id"
          :label="item.label"
          :checked="false"
          @toggle="handleToggle(item.id)"
        >
          <template v-if="item.detail" #detail>
            <div class="text-xs text-stone-400 ml-8 mt-1">{{ item.detail }}</div>
          </template>
        </CheckableItem>

        <!-- Divider when both exist -->
        <div
          v-if="uncheckedItems.length > 0 && checkedItems.length > 0"
          class="h-px bg-stone-200 my-1"
        />

        <!-- Checked items sink to bottom, smaller -->
        <div
          v-for="item in checkedItems"
          :key="item.id"
          @click="handleToggle(item.id)"
          class="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-stone-100 opacity-50 text-sm transition-all"
        >
          <span class="w-4 h-4 border-2 bg-ink border-ink text-white flex items-center justify-center text-xs flex-shrink-0">✓</span>
          <span class="text-stone-400 line-through">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
