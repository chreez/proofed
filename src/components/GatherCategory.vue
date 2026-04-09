<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { ClipboardList, Check } from 'lucide-vue-next'
import CheckableItem from '@/components/CheckableItem.vue'
import IconButton from '@/components/IconButton.vue'
import TechniqueText from '@/components/TechniqueText.vue'
import TempText from '@/components/TempText.vue'
import { scrollToNextItem, scrollToStageAfterTransition } from '@/composables/useScrollToNext'
import { copyToClipboard } from '@/composables/useClipboard'

const props = withDefaults(defineProps<{
  title: string
  items: { id: string; label: string; detail?: string }[]
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
  stageId: string
  startCollapsed?: boolean
}>(), {
  startCollapsed: false
})

const categoryCopyBtn = useTemplateRef<InstanceType<typeof IconButton>>('categoryCopyBtn')

// Manual expand override - user clicked badge to expand
const manuallyExpanded = ref(false)
// Manual collapse - user clicked ▲ to hide a section, or starts collapsed via prop
const manuallyCollapsed = ref(props.startCollapsed)

const checkedItems = computed(() =>
  props.items.filter(item => props.progress.isItemChecked(item.id))
)

const uncheckedItems = computed(() =>
  props.items.filter(item => !props.progress.isItemChecked(item.id))
)

const allChecked = computed(() =>
  props.items.length > 0 && checkedItems.value.length === props.items.length
)

// Collapse if: (all checked and not manually expanded) OR manually collapsed
const isCollapsed = computed(() =>
  (allChecked.value && !manuallyExpanded.value) || manuallyCollapsed.value
)

// Badge text: "3/3 ✓" when all done, "2/5" when partially done
const badgeText = computed(() =>
  allChecked.value
    ? `${props.items.length}/${props.items.length} ✓`
    : `${checkedItems.value.length}/${props.items.length}`
)

// Reset overrides when check state changes
watch(allChecked, (newVal) => {
  if (!newVal) {
    manuallyExpanded.value = false
  }
})

// Contextual label
const toggleLabel = computed(() => allChecked.value ? 'Clear All' : 'Complete All')

function handleToggle(itemId: string) {
  const wasChecked = props.progress.isItemChecked(itemId)
  const advancedTo = props.progress.toggleItem(itemId, props.stageId)

  if (advancedTo) {
    scrollToStageAfterTransition(advancedTo)
    return
  }

  if (!wasChecked) {
    const idx = props.items.findIndex(item => item.id === itemId)
    const nextUnchecked = props.items.slice(idx + 1).find(
      item => !props.progress.isItemChecked(item.id)
    )
    if (nextUnchecked) {
      scrollToNextItem(`[data-item-id="${nextUnchecked.id}"]`)
    }
  }
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
    let advancedTo: string | null = null
    props.items.forEach(item => {
      if (!props.progress.isItemChecked(item.id)) {
        const result = props.progress.toggleItem(item.id, props.stageId)
        if (result) advancedTo = result
      }
    })
    if (advancedTo) {
      scrollToStageAfterTransition(advancedTo)
    }
  }
}

function expand() {
  manuallyExpanded.value = true
  manuallyCollapsed.value = false
}

function collapse() {
  if (allChecked.value) {
    manuallyExpanded.value = false
  } else {
    manuallyCollapsed.value = true
  }
}

async function copyCategory(): Promise<void> {
  const text = uncheckedItems.value.map(item => item.label).join('\n')
  await copyToClipboard(text)
  categoryCopyBtn.value?.flashCopied()
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
        class="text-xs bg-ink text-stone-50 px-2 py-0.5"
      >
        {{ badgeText }}
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
            style="accent-color: var(--color-accent);"
          >
          {{ toggleLabel }}
        </label>
        <IconButton
          v-if="uncheckedItems.length > 0"
          ref="categoryCopyBtn"
          tooltip="Copy List"
          size="sm"
          tooltip-align="right"
          @click="copyCategory"
        >
          <ClipboardList />
          <template #feedback>
            <Check />
          </template>
        </IconButton>
        <button
          @click.stop="collapse"
          class="text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 transition-colors select-none"
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
              <div class="text-xs text-stone-400 ml-8 mt-1"><TempText :text="item.detail" /></div>
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
              style="accent-color: var(--color-accent);"
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
