<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef, watch } from 'vue'
import { StickyNote, X, Bell, Pencil, Trash2 } from 'lucide-vue-next'
import BottomSheet from '@/components/BottomSheet.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { StepReminder, ScratchpadEntry } from '@/types/recipe'

const props = defineProps<{
  stepId: string
  stepName: string
  reminders?: StepReminder[]
  entries: ScratchpadEntry[]
  hasEntries: boolean
}>()

const emit = defineEmits<{
  addNote: [stepId: string, value: string]
  respond: [stepId: string, prompt: string, value: string]
  editEntry: [stepId: string, index: number, value: string]
  deleteEntry: [stepId: string, index: number]
}>()

const noteTextarea = useTemplateRef<HTMLTextAreaElement>('noteTextarea')
const isOpen = ref(false)
const noteText = ref('')
const reminderResponses = ref<Record<string, string>>({})

// PF-239: edit/delete state. editingIndex enforces single-edit-at-a-time;
// confirmingDeleteIndex drives the inline confirm dialog. Both reset whenever
// the popover closes or the entries list changes shape (e.g. after delete).
const editingIndex = ref<number | null>(null)
const editValue = ref('')
const confirmingDeleteIndex = ref<number | null>(null)

// md breakpoint = 768px (UnoCSS default)
const { matches: isDesktop } = useMediaQuery('(min-width: 768px)')

function toggle(event: MouseEvent): void {
  event.stopPropagation()
  isOpen.value = !isOpen.value
  if (isOpen.value && isDesktop.value) {
    nextTick(() => noteTextarea.value?.focus())
  } else if (!isOpen.value) {
    cancelEdit()
    cancelDeleteConfirm()
  }
}

function close(): void {
  isOpen.value = false
  cancelEdit()
  cancelDeleteConfirm()
}

function handleNoteKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSaveNote()
  }
}

function handleSaveNote(): void {
  if (!noteText.value.trim()) return
  emit('addNote', props.stepId, noteText.value)
  noteText.value = ''
}

function handleReminderRespond(prompt: string): void {
  const value = reminderResponses.value[prompt]
  if (value?.trim()) {
    emit('respond', props.stepId, prompt, value)
    reminderResponses.value[prompt] = ''
  }
}

function startEdit(index: number, currentValue: string): void {
  editingIndex.value = index
  editValue.value = currentValue
  // Cancel any pending delete-confirm in favor of edit
  confirmingDeleteIndex.value = null
}

function cancelEdit(): void {
  editingIndex.value = null
  editValue.value = ''
}

function saveEdit(): void {
  if (editingIndex.value === null) return
  const trimmed = editValue.value.trim()
  if (!trimmed) {
    cancelEdit()
    return
  }
  emit('editEntry', props.stepId, editingIndex.value, trimmed)
  cancelEdit()
}

function handleEditKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    saveEdit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancelEdit()
  }
}

function startDeleteConfirm(index: number): void {
  confirmingDeleteIndex.value = index
  // Cancel any in-progress edit; one action at a time
  cancelEdit()
}

function cancelDeleteConfirm(): void {
  confirmingDeleteIndex.value = null
}

function confirmDelete(): void {
  if (confirmingDeleteIndex.value === null) return
  const idx = confirmingDeleteIndex.value
  confirmingDeleteIndex.value = null
  emit('deleteEntry', props.stepId, idx)
}

// Reset edit/delete state if entries list shrinks (e.g. parent removed an
// entry through another path). Prevents stale indexes from being applied.
watch(
  () => props.entries.length,
  () => {
    if (
      editingIndex.value !== null &&
      editingIndex.value >= props.entries.length
    ) {
      cancelEdit()
    }
    if (
      confirmingDeleteIndex.value !== null &&
      confirmingDeleteIndex.value >= props.entries.length
    ) {
      cancelDeleteConfirm()
    }
  }
)

const hasReminders = computed(() => !!props.reminders?.length)

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

const formattedEntries = computed(() => {
  return props.entries.map(e => ({
    ...e,
    time: formatTimestamp(e.timestamp)
  }))
})

</script>

<template>
  <div class="relative inline-flex items-center">
    <button
      class="inline-flex items-center justify-center transition-colors flex-shrink-0 w-9 h-9 md:w-7 md:h-7"
      :class="hasEntries
        ? 'text-accent hover:bg-accent-tint'
        : 'text-stone-400 hover:text-accent hover:bg-stone-100'"
      :title="hasEntries ? 'View/add notes' : 'Add note'"
      @click="toggle"
    >
      <StickyNote class="w-4.5 h-4.5 md:w-3.5 md:h-3.5" />
    </button>
    <span
      v-if="hasEntries"
      class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-stone-50 text-[9px] font-mono flex items-center justify-center pointer-events-none"
    >{{ entries.length > 9 ? '9+' : entries.length }}</span>

    <!-- Desktop: Popover panel (md and above) -->
    <Transition name="slide-down">
      <div
        v-if="isOpen && isDesktop"
        class="absolute top-full mt-1 w-72 max-w-[calc(100vw-2rem)] bg-surface border-2 border-stone-200 shadow-lg z-30 right-0 md:right-auto md:left-0"
        @click.stop
        @keydown.esc="close"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
          <div class="flex flex-col">
            <span class="font-mono text-xs text-stone-600">{{ stepName }}</span>
            <span class="font-mono text-[10px] text-stone-400">{{ stepId }}</span>
          </div>
          <button @click="close" class="text-stone-400 hover:text-ink">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="p-3 space-y-3 max-h-80 overflow-y-auto">
          <!-- Saved entries for this step -->
          <div v-if="hasEntries" class="space-y-1.5">
            <span class="font-mono text-[10px] text-stone-500 block">notes ({{ entries.length }})</span>
            <div
              v-for="(entry, i) in formattedEntries"
              :key="entry.timestamp + '-' + i"
              class="bg-stone-50 border border-stone-200 p-2"
              data-testid="scratchpad-entry"
            >
              <div class="flex items-center gap-1.5 mb-0.5">
                <span
                  class="font-mono text-[10px]"
                  :class="entry.type === 'reminder_response' ? 'text-accent' : entry.type === 'rating' ? 'text-crust-dark' : 'text-stone-400'"
                >{{ entry.type === 'reminder_response' ? 'reminder' : entry.type }}</span>
                <span class="font-mono text-[10px] text-stone-400">{{ entry.time }}</span>
                <div class="ml-auto flex items-center gap-0.5">
                  <button
                    v-if="editingIndex !== i"
                    type="button"
                    class="w-5 h-5 inline-flex items-center justify-center text-stone-400 hover:text-accent hover:bg-stone-100 transition-colors"
                    title="Edit entry"
                    aria-label="Edit entry"
                    data-testid="edit-entry-btn"
                    @click="startEdit(i, entry.value)"
                  >
                    <Pencil class="w-3 h-3" />
                  </button>
                  <button
                    v-if="editingIndex !== i"
                    type="button"
                    class="w-5 h-5 inline-flex items-center justify-center text-stone-400 hover:text-accent hover:bg-stone-100 transition-colors"
                    title="Delete entry"
                    aria-label="Delete entry"
                    data-testid="delete-entry-btn"
                    @click="startDeleteConfirm(i)"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p v-if="entry.prompt" class="text-[10px] text-stone-500 italic mb-0.5">{{ entry.prompt }}</p>
              <template v-if="editingIndex === i">
                <textarea
                  v-model="editValue"
                  class="w-full border-2 border-stone-200 p-1.5 text-base md:text-xs bg-surface resize-none rounded-none mb-1"
                  rows="2"
                  data-testid="edit-entry-textarea"
                  @keydown="handleEditKeydown"
                />
                <div class="flex justify-end gap-1.5">
                  <button
                    type="button"
                    class="font-mono text-[10px] text-stone-500 hover:text-ink py-0.5 px-1.5"
                    data-testid="edit-cancel-btn"
                    @click="cancelEdit"
                  >Cancel</button>
                  <button
                    type="button"
                    class="btn-primary text-[10px] py-0.5 px-2"
                    data-testid="edit-save-btn"
                    @click="saveEdit"
                  >Save</button>
                </div>
              </template>
              <template v-else>
                <p class="text-xs text-stone-700">{{ entry.value }}</p>
                <div
                  v-if="confirmingDeleteIndex === i"
                  class="mt-1.5 flex items-center justify-between gap-1.5 bg-accent-tint border border-accent p-1.5"
                  data-testid="delete-confirm"
                >
                  <span class="font-mono text-[10px] text-crust-dark">Delete this entry?</span>
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      class="font-mono text-[10px] text-stone-500 hover:text-ink py-0.5 px-1.5"
                      data-testid="delete-cancel-btn"
                      @click="cancelDeleteConfirm"
                    >Cancel</button>
                    <button
                      type="button"
                      class="btn-primary text-[10px] py-0.5 px-2"
                      data-testid="delete-confirm-btn"
                      @click="confirmDelete"
                    >Delete</button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Prompted questions from reminders -->
          <div v-if="hasReminders" class="space-y-2">
            <div
              v-for="reminder in reminders"
              :key="reminder.prompt"
              class="bg-cream border-l-4 border-accent p-2"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <Bell class="w-3 h-3 text-accent" />
                <span class="font-mono text-[10px] text-crust-dark">prompted</span>
              </div>
              <p class="text-xs text-stone-700 mb-1.5">{{ reminder.prompt }}</p>
              <div class="flex gap-1.5">
                <input
                  v-model="reminderResponses[reminder.prompt]"
                  class="flex-1 border-2 border-stone-200 p-1.5 text-base md:text-xs bg-surface rounded-none"
                  :placeholder="reminder.type === 'measurement' ? 'e.g. 748g' : 'Response...'"
                  @keydown.enter="handleReminderRespond(reminder.prompt)"
                />
                <button
                  class="btn-primary text-[10px] py-1 px-2"
                  @click="handleReminderRespond(reminder.prompt)"
                >Log</button>
              </div>
            </div>
          </div>

          <!-- Freeform note -->
          <div>
            <span class="font-mono text-[10px] text-stone-500 mb-1.5 block">Note</span>
            <textarea
              ref="noteTextarea"
              v-model="noteText"
              class="w-full border-2 border-stone-200 p-2 text-base md:text-xs bg-surface resize-none rounded-none"
              rows="2"
              placeholder="What happened? Texture, color, timing..."
              @keydown="handleNoteKeydown"
              @keydown.esc="close"
            />
            <div class="flex justify-between items-center mt-1.5">
              <span class="font-mono text-[10px] text-stone-400">shift+enter for newline</span>
              <button
                class="btn-primary text-[10px] py-0.5 px-2"
                @click="handleSaveNote"
              >Save</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile: Bottom Sheet (below md) -->
    <BottomSheet
      :open="isOpen && !isDesktop"
      :title="stepName"
      :subtitle="stepId"
      @close="close"
    >
      <div class="p-4 space-y-4">
        <!-- Saved entries for this step -->
        <div v-if="hasEntries" class="space-y-2">
          <span class="font-mono text-xs text-stone-500 block">notes ({{ entries.length }})</span>
          <div
            v-for="(entry, i) in formattedEntries"
            :key="entry.timestamp + '-' + i"
            class="bg-stone-50 border border-stone-200 p-3"
            data-testid="scratchpad-entry"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span
                class="font-mono text-xs"
                :class="entry.type === 'reminder_response' ? 'text-accent' : entry.type === 'rating' ? 'text-crust-dark' : 'text-stone-400'"
              >{{ entry.type === 'reminder_response' ? 'reminder' : entry.type }}</span>
              <span class="font-mono text-xs text-stone-400">{{ entry.time }}</span>
              <div class="ml-auto flex items-center gap-1">
                <button
                  v-if="editingIndex !== i"
                  type="button"
                  class="w-7 h-7 inline-flex items-center justify-center text-stone-400 hover:text-accent hover:bg-stone-100 transition-colors"
                  title="Edit entry"
                  aria-label="Edit entry"
                  data-testid="edit-entry-btn"
                  @click="startEdit(i, entry.value)"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  v-if="editingIndex !== i"
                  type="button"
                  class="w-7 h-7 inline-flex items-center justify-center text-stone-400 hover:text-accent hover:bg-stone-100 transition-colors"
                  title="Delete entry"
                  aria-label="Delete entry"
                  data-testid="delete-entry-btn"
                  @click="startDeleteConfirm(i)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <p v-if="entry.prompt" class="text-xs text-stone-500 italic mb-1">{{ entry.prompt }}</p>
            <template v-if="editingIndex === i">
              <textarea
                v-model="editValue"
                class="w-full border-2 border-stone-200 p-2 text-base bg-surface resize-none rounded-none mb-2"
                rows="3"
                data-testid="edit-entry-textarea"
                @keydown="handleEditKeydown"
              />
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="font-mono text-xs text-stone-500 hover:text-ink py-1 px-2"
                  data-testid="edit-cancel-btn"
                  @click="cancelEdit"
                >Cancel</button>
                <button
                  type="button"
                  class="btn-primary text-xs py-1 px-3"
                  data-testid="edit-save-btn"
                  @click="saveEdit"
                >Save</button>
              </div>
            </template>
            <template v-else>
              <p class="text-sm text-stone-700">{{ entry.value }}</p>
              <div
                v-if="confirmingDeleteIndex === i"
                class="mt-2 flex items-center justify-between gap-2 bg-accent-tint border border-accent p-2"
                data-testid="delete-confirm"
              >
                <span class="font-mono text-xs text-crust-dark">Delete this entry?</span>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="font-mono text-xs text-stone-500 hover:text-ink py-1 px-2"
                    data-testid="delete-cancel-btn"
                    @click="cancelDeleteConfirm"
                  >Cancel</button>
                  <button
                    type="button"
                    class="btn-primary text-xs py-1 px-3"
                    data-testid="delete-confirm-btn"
                    @click="confirmDelete"
                  >Delete</button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Prompted questions from reminders -->
        <div v-if="hasReminders" class="space-y-3">
          <div
            v-for="reminder in reminders"
            :key="reminder.prompt"
            class="bg-cream border-l-4 border-accent p-3"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <Bell class="w-4 h-4 text-accent" />
              <span class="font-mono text-xs text-crust-dark">prompted</span>
            </div>
            <p class="text-sm text-stone-700 mb-2">{{ reminder.prompt }}</p>
            <div class="flex gap-2">
              <input
                v-model="reminderResponses[reminder.prompt]"
                class="flex-1 border-2 border-stone-200 p-2 text-base bg-surface rounded-none"
                :placeholder="reminder.type === 'measurement' ? 'e.g. 748g' : 'Response...'"
                @keydown.enter="handleReminderRespond(reminder.prompt)"
              />
              <button
                class="btn-primary text-xs py-1.5 px-3"
                @click="handleReminderRespond(reminder.prompt)"
              >Log</button>
            </div>
          </div>
        </div>

        <!-- Freeform note -->
        <div>
          <span class="font-mono text-xs text-stone-500 mb-2 block">Note</span>
          <textarea
            v-model="noteText"
            class="w-full border-2 border-stone-200 p-3 text-base bg-surface resize-none rounded-none"
            rows="3"
            placeholder="What happened? Texture, color, timing..."
            @keydown="handleNoteKeydown"
          />
          <div class="flex justify-between items-center mt-2">
            <span class="font-mono text-xs text-stone-400">enter to save</span>
            <button
              class="btn-primary text-xs py-1 px-3"
              @click="handleSaveNote"
            >Save</button>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
