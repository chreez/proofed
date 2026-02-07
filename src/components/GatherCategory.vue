<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CheckableItem from '@/components/CheckableItem.vue'
import TechniqueText from '@/components/TechniqueText.vue'

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
    <!-- Header row -->
    <div
      class="flex justify-between items-center transition-all duration-300"
      :class="isCollapsed
        ? 'bg-stone-200 px-3 py-2 cursor-pointer hover:bg-stone-300'
        : 'mb-2'"
      @click="isCollapsed ? expand() : undefined"
    >
      <h5
        class="text-xs uppercase transition-colors duration-200"
        :class="isCollapsed ? 'text-stone-600' : 'text-stone-400'"
      >
        {{ title }}
      </h5>

      <!-- Collapsed: badge -->
      <span
        v-if="isCollapsed"
        class="text-xs bg-ink text-white px-2 py-0.5"
      >
        {{ items.length }}/{{ items.length }} ✓
      </span>

      <!-- Expanded: controls -->
      <div v-else class="flex items-center gap-2">
        <label
          @click="handleCompleteAllClick"
          class="flex items-center gap-1.5 text-xs cursor-pointer select-none transition-colors"
          :class="allChecked ? 'text-stone-500 hover:text-danger' : 'text-stone-400 hover:text-stone-600'"
        >
          <input
            type="checkbox"
            :checked="allChecked"
            class="pointer-events-none"
            style="accent-color: #a65d45;"
          >
          {{ toggleLabel }}
        </label>
        <button
          v-if="allChecked && manuallyExpanded"
          @click="collapse"
          class="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          title="Collapse"
        >
          ▲
        </button>
      </div>
    </div>

    <!-- Content with grid animation -->
    <div
      class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
    >
      <div class="overflow-hidden">
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
          <label
            v-for="item in checkedItems"
            :key="item.id"
            class="flex items-center gap-2 px-2 py-1 rounded-none cursor-pointer hover:bg-stone-100 opacity-50 text-sm transition-all duration-200"
          >
            <input
              type="checkbox"
              checked
              @change="handleToggle(item.id)"
              class="w-4 h-4 flex-shrink-0"
              style="accent-color: #a65d45;"
            >
            <span class="text-stone-400 line-through">
              <TechniqueText :text="item.label" />
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
