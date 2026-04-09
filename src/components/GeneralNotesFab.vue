<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { MessageSquare, X, Download, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { ScratchpadEntry } from '@/types/recipe'

const props = defineProps<{
  generalNoteCount: number
  totalEntryCount: number
  generalNotes: ScratchpadEntry[]
  stepEntries: Record<string, ScratchpadEntry[]>
  stepNames: Record<string, string>
}>()

const emit = defineEmits<{
  addGeneralNote: [value: string]
  exportJson: []
  clearAll: []
}>()

const exportBtn = useTemplateRef<InstanceType<typeof IconButton>>('exportBtn')
const isOpen = ref(false)
const noteText = ref('')

function toggle(): void {
  isOpen.value = !isOpen.value
}

function close(): void {
  isOpen.value = false
}

function handleSave(): void {
  if (!noteText.value.trim()) return
  emit('addGeneralNote', noteText.value)
  noteText.value = ''
}

function handleExport(): void {
  emit('exportJson')
  exportBtn.value?.flashCopied()
}

function handleClear(): void {
  emit('clearAll')
}

const showStepEntries = ref(false)

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

const formattedNotes = computed(() => {
  return props.generalNotes.map(n => ({
    ...n,
    time: formatTimestamp(n.timestamp)
  }))
})

const stepEntryCount = computed(() => {
  return Object.values(props.stepEntries).reduce((sum, arr) => sum + arr.length, 0)
})

const formattedStepEntries = computed(() => {
  return Object.entries(props.stepEntries)
    .filter(([, entries]) => entries.length > 0)
    .map(([stepId, entries]) => ({
      stepId,
      entries: entries.map(e => ({
        ...e,
        time: formatTimestamp(e.timestamp)
      }))
    }))
})
</script>

<template>
  <!-- FAB button - bottom left (TocSidebar FAB is bottom right) -->
  <button
    @click="toggle"
    class="md:fixed md:bottom-4 md:left-4 hidden md:flex w-10 h-10 items-center justify-center shadow-md z-40 transition-transform active:scale-95"
    :class="isOpen ? 'bg-accent text-stone-50' : 'bg-ink text-stone-50'"
    aria-label="Open bake scratchpad"
  >
    <MessageSquare v-if="!isOpen" class="w-4 h-4" />
    <X v-else class="w-4 h-4" />
    <!-- Badge -->
    <span
      v-if="totalEntryCount > 0 && !isOpen"
      class="absolute -top-1 -right-1 w-4 h-4 bg-accent text-stone-50 text-[10px] font-mono flex items-center justify-center"
    >{{ totalEntryCount > 9 ? '9+' : totalEntryCount }}</span>
  </button>

  <!-- Mobile FAB - bottom left -->
  <button
    @click="toggle"
    class="md:hidden fixed bottom-4 left-4 w-10 h-10 flex items-center justify-center shadow-md z-40 transition-transform active:scale-95"
    :class="isOpen ? 'bg-accent text-stone-50' : 'bg-ink text-stone-50'"
    aria-label="Open bake scratchpad"
  >
    <MessageSquare v-if="!isOpen" class="w-4 h-4" />
    <X v-else class="w-4 h-4" />
    <span
      v-if="totalEntryCount > 0 && !isOpen"
      class="absolute -top-1 -right-1 w-4 h-4 bg-accent text-stone-50 text-[10px] font-mono flex items-center justify-center"
    >{{ totalEntryCount > 9 ? '9+' : totalEntryCount }}</span>
  </button>

  <!-- Panel -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/20 z-50"
        @click="close"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="fixed bottom-16 left-4 w-80 max-h-[60vh] bg-surface border-2 border-stone-200 shadow-lg z-50 flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50 flex-shrink-0">
          <div class="flex items-center gap-2">
            <MessageSquare class="w-4 h-4 text-accent" />
            <span class="font-mono text-xs text-stone-600">Bake Scratchpad</span>
          </div>
          <div class="flex items-center">
            <IconButton
              ref="exportBtn"
              tooltip="Copy JSON"
              size="sm"
              tooltip-align="right"
              @click="handleExport"
            >
              <Download />
              <template #feedback><Check /></template>
            </IconButton>
            <IconButton
              v-if="totalEntryCount > 0"
              tooltip="Clear all"
              size="sm"
              tooltip-align="right"
              @click="handleClear"
            >
              <Trash2 />
            </IconButton>
            <IconButton
              tooltip="Close"
              size="sm"
              tooltip-align="right"
              @click="close"
            >
              <X />
            </IconButton>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="overflow-y-auto flex-1 p-3 space-y-3">
          <!-- Existing general notes -->
          <div v-if="formattedNotes.length" class="space-y-2">
            <span class="font-mono text-[10px] text-stone-500 block">notes ({{ generalNoteCount }})</span>
            <div
              v-for="(note, i) in formattedNotes"
              :key="i"
              class="bg-stone-50 border border-stone-200 p-2"
            >
              <p class="text-xs text-stone-700">{{ note.value }}</p>
              <span class="font-mono text-[10px] text-stone-400 mt-1 block">{{ note.time }}</span>
            </div>
          </div>

          <!-- Step-specific entries (expandable) -->
          <div v-if="stepEntryCount > 0">
            <button
              class="flex items-center gap-1 text-[10px] text-stone-500 font-mono hover:text-accent transition-colors"
              @click="showStepEntries = !showStepEntries"
            >
              <ChevronDown v-if="showStepEntries" class="w-3 h-3" />
              <ChevronRight v-else class="w-3 h-3" />
              {{ stepEntryCount }} step-specific {{ stepEntryCount === 1 ? 'entry' : 'entries' }}
            </button>
            <div v-if="showStepEntries" class="mt-2 space-y-2">
              <div v-for="group in formattedStepEntries" :key="group.stepId">
                <span class="font-mono text-[10px] text-stone-500 block mb-1">{{ stepNames[group.stepId] || group.stepId }}</span>
                <div
                  v-for="(entry, i) in group.entries"
                  :key="i"
                  class="bg-stone-50 border border-stone-200 p-2 mb-1"
                >
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span
                      class="font-mono text-[10px]"
                      :class="entry.type === 'reminder_response' ? 'text-accent' : entry.type === 'rating' ? 'text-crust-dark' : 'text-stone-400'"
                    >{{ entry.type === 'reminder_response' ? 'reminder' : entry.type }}</span>
                    <span class="font-mono text-[10px] text-stone-400">{{ entry.time }}</span>
                  </div>
                  <p v-if="entry.prompt" class="text-[10px] text-stone-500 italic mb-0.5">{{ entry.prompt }}</p>
                  <p class="text-xs text-stone-700">{{ entry.value }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- New note input -->
          <div>
            <span class="font-mono text-[10px] text-stone-500 mb-1.5 block">General observation</span>
            <textarea
              v-model="noteText"
              class="w-full border-2 border-stone-200 p-2 text-xs bg-surface resize-none rounded-none"
              rows="3"
              placeholder="Overall bake observation..."
              @keydown.ctrl.enter="handleSave"
              @keydown.meta.enter="handleSave"
            />
            <div class="flex justify-between items-center mt-1.5">
              <span class="font-mono text-[10px] text-stone-400">cmd+enter to save</span>
              <button
                class="btn-primary text-[10px] py-0.5 px-2"
                @click="handleSave"
              >Save</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
