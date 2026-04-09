<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from 'vue'
import { StickyNote, X, Bell } from 'lucide-vue-next'
import BottomSheet from '@/components/BottomSheet.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { StepReminder, ScratchpadEntry } from '@/types/recipe'

const props = defineProps<{
  stepId: string
  stepName: string
  reminders?: StepReminder[]
  entries: ScratchpadEntry[]
  hasEntries: boolean
  currentRating: 'good' | 'ok' | 'bad' | null
}>()

const emit = defineEmits<{
  addNote: [stepId: string, value: string]
  addRating: [stepId: string, rating: 'good' | 'ok' | 'bad']
  respond: [stepId: string, prompt: string, value: string]
}>()

const noteTextarea = useTemplateRef<HTMLTextAreaElement>('noteTextarea')
const isOpen = ref(false)
const noteText = ref('')
const reminderResponses = ref<Record<string, string>>({})

// md breakpoint = 768px (UnoCSS default)
const { matches: isDesktop } = useMediaQuery('(min-width: 768px)')

function toggle(event: MouseEvent): void {
  event.stopPropagation()
  isOpen.value = !isOpen.value
  if (isOpen.value && isDesktop.value) {
    nextTick(() => noteTextarea.value?.focus())
  }
}

function close(): void {
  isOpen.value = false
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

function handleRating(rating: 'good' | 'ok' | 'bad'): void {
  emit('addRating', props.stepId, rating)
}

function handleReminderRespond(prompt: string): void {
  const value = reminderResponses.value[prompt]
  if (value?.trim()) {
    emit('respond', props.stepId, prompt, value)
    reminderResponses.value[prompt] = ''
  }
}

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
            <span class="font-mono text-xs text-stone-600">scratchpad: {{ stepName }}</span>
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
              :key="i"
              class="bg-stone-50 border border-stone-200 p-2"
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

          <!-- Quick rating -->
          <div>
            <span class="font-mono text-[10px] text-stone-500 mb-1.5 block">Quick rating</span>
            <div class="flex gap-1.5">
              <button
                v-for="r in (['good', 'ok', 'bad'] as const)"
                :key="r"
                class="btn text-[10px] py-0.5 px-2 border-2 border-stone-200"
                :class="currentRating === r
                  ? (r === 'good' ? 'bg-success text-stone-50 border-success' : r === 'ok' ? 'bg-warning text-ink border-warning' : 'bg-danger text-stone-50 border-danger')
                  : 'bg-surface text-ink hover:bg-stone-100'"
                @click="handleRating(r)"
              >{{ r }}</button>
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
      :title="`scratchpad: ${stepName}`"
      :subtitle="stepId"
      @close="close"
    >
      <div class="p-4 space-y-4">
        <!-- Saved entries for this step -->
        <div v-if="hasEntries" class="space-y-2">
          <span class="font-mono text-xs text-stone-500 block">notes ({{ entries.length }})</span>
          <div
            v-for="(entry, i) in formattedEntries"
            :key="i"
            class="bg-stone-50 border border-stone-200 p-3"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span
                class="font-mono text-xs"
                :class="entry.type === 'reminder_response' ? 'text-accent' : entry.type === 'rating' ? 'text-crust-dark' : 'text-stone-400'"
              >{{ entry.type === 'reminder_response' ? 'reminder' : entry.type }}</span>
              <span class="font-mono text-xs text-stone-400">{{ entry.time }}</span>
            </div>
            <p v-if="entry.prompt" class="text-xs text-stone-500 italic mb-1">{{ entry.prompt }}</p>
            <p class="text-sm text-stone-700">{{ entry.value }}</p>
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

        <!-- Quick rating -->
        <div>
          <span class="font-mono text-xs text-stone-500 mb-2 block">Quick rating</span>
          <div class="flex gap-2">
            <button
              v-for="r in (['good', 'ok', 'bad'] as const)"
              :key="r"
              class="btn text-sm py-1.5 px-4 border-2 border-stone-200"
              :class="currentRating === r
                ? (r === 'good' ? 'bg-success text-stone-50 border-success' : r === 'ok' ? 'bg-warning text-ink border-warning' : 'bg-danger text-stone-50 border-danger')
                : 'bg-surface text-ink hover:bg-stone-100'"
              @click="handleRating(r)"
            >{{ r }}</button>
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
