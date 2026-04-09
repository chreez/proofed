<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeState, RecipeConfig } from '@/types/recipe'
import type { useScratchpad } from '@/composables/useScratchpad'
import TimerDisplay from '@/components/TimerDisplay.vue'
import StepNote from '@/components/StepNote.vue'
import TempText from '@/components/TempText.vue'
import ScratchpadNote from '@/components/ScratchpadNote.vue'
import ReminderBanner from '@/components/ReminderBanner.vue'

interface StepNoteData {
  note: string
  date: string
}

const props = defineProps<{
  state: RecipeState
  stageId: string
  config: RecipeConfig
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
  stepNote?: StepNoteData
  scratchpad?: ReturnType<typeof useScratchpad>
  isActiveStep?: boolean
}>()

const emit = defineEmits<{
  toggled: [stateId: string]
}>()

const isChecked = computed(() => props.progress.isStateChecked(props.state.id))

function toggle() {
  props.progress.toggleState(props.state.id, props.stageId)
  emit('toggled', props.state.id)
}

// Scratchpad handlers
function handleAddNote(stepId: string, value: string): void {
  props.scratchpad?.addNote(stepId, value)
}

function handleAddRating(stepId: string, rating: 'good' | 'ok' | 'bad'): void {
  props.scratchpad?.addRating(stepId, rating)
}

function handleReminderRespond(stepId: string, prompt: string, value: string): void {
  props.scratchpad?.addReminderResponse(stepId, prompt, value)
}

function handleReminderDismiss(stepId: string, prompt: string): void {
  props.scratchpad?.dismissReminder(stepId, prompt)
}

const stepEntries = computed(() => props.scratchpad?.getEntriesForStep(props.state.id) ?? [])
const hasEntries = computed(() => stepEntries.value.length > 0)
const currentRating = computed(() => props.scratchpad?.getRatingForStep(props.state.id) ?? null)
const showReminders = computed(() =>
  !!props.state.reminders?.length && props.isActiveStep && !isChecked.value
)

// PF-180: parse a source string into a sequence of text + URL segments so the
// renderer can emit anchor tags for any https?:// links found inline.
type SourceSegment = { kind: 'text'; value: string } | { kind: 'url'; value: string }
function parseSourceSegments(src: string): SourceSegment[] {
  const urlPattern = /https?:\/\/[^\s)]+/g
  const out: SourceSegment[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null
  while ((match = urlPattern.exec(src)) !== null) {
    if (match.index > lastIdx) {
      out.push({ kind: 'text', value: src.slice(lastIdx, match.index) })
    }
    out.push({ kind: 'url', value: match[0] })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < src.length) {
    out.push({ kind: 'text', value: src.slice(lastIdx) })
  }
  return out
}
</script>

<template>
  <div
    :data-state-id="state.id"
    class="bg-surface p-4 border-2 border-stone-200 transition-opacity scroll-mt-16"
    :class="{ 'opacity-50': isChecked }"
  >
    <!-- Reminder banner: appears when this step is active and has reminders -->
    <ReminderBanner
      v-if="showReminders && scratchpad"
      :step-id="state.id"
      :step-title="state.title"
      :reminders="state.reminders!"
      :is-reminder-dismissed="scratchpad.isReminderDismissed"
      @respond="handleReminderRespond"
      @dismiss="handleReminderDismiss"
    />

    <div class="flex items-start gap-3">
      <button
        @click="toggle"
        class="mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        :class="isChecked ? 'bg-ink border-ink text-stone-50' : 'border-ink hover:bg-stone-100'"
      >
        <span v-if="isChecked" class="text-xs">✓</span>
      </button>

      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <h4 class="font-medium text-stone-700" :class="{ 'line-through': isChecked }">
            {{ state.title }}
          </h4>
          <!-- Scratchpad note icon -->
          <ScratchpadNote
            v-if="scratchpad"
            :step-id="state.id"
            :reminders="state.reminders"
            :entries="stepEntries"
            :has-entries="hasEntries"
            :current-rating="currentRating"
            @add-note="handleAddNote"
            @add-rating="handleAddRating"
            @respond="handleReminderRespond"
          />
          <span v-if="state.parallel" class="text-xs bg-stone-200 text-stone-600 px-2 py-0.5">
            parallel
          </span>
          <TimerDisplay
            v-if="state.duration_min"
            :duration-min="state.duration_min"
            :passive="!!state.timer"
          />
        </div>

        <p class="text-body text-sm mb-3">{{ state.direction }}</p>

        <div v-if="state.components?.length" class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="comp in state.components"
            :key="comp.name"
            class="text-xs bg-stone-100 text-stone-700 px-2 py-1"
          >
            <TempText :text="comp.name" />: {{ comp.amount }}
          </span>
        </div>

        <div v-if="state.notes?.length" class="mt-3 space-y-2">
          <div
            v-for="(note, i) in state.notes"
            :key="i"
            class="text-sm p-2"
            :class="note.critical && note.source !== 'agent' ? 'bg-accent-tint text-accent border-l-4 border-accent' : 'bg-stone-100 text-stone-600'"
          >
            <div v-if="note.source === 'agent'" class="voice-agent-label mb-1">// Agent Tip</div>
            <span v-if="note.critical && note.source !== 'agent'" class="font-medium">⚠ </span>
            <span v-if="note.text">{{ note.text }}</span>

            <!-- Optional structured table (PF-180) — Variant B: bottom borders + zebra -->
            <div v-if="note.table" class="sn-table-block" :class="{ 'sn-table-block--has-text': !!note.text }">
              <p v-if="note.table.caption" class="sn-table-caption">{{ note.table.caption }}</p>
              <div class="sn-table-scroll">
                <table class="sn-table">
                  <thead>
                    <tr>
                      <th
                        v-for="(header, hi) in note.table.headers"
                        :key="hi"
                        scope="col"
                        class="sn-th"
                        :class="{ 'sn-th-right': header.type === 'number' || header.type === 'percent' }"
                      >
                        {{ header.label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in note.table.rows" :key="ri">
                      <td
                        v-for="(cell, ci) in row"
                        :key="ci"
                        class="sn-td"
                        :class="{
                          'sn-td-right': note.table!.headers[ci]?.type === 'number' || note.table!.headers[ci]?.type === 'percent',
                          'sn-td-mono': note.table!.headers[ci]?.type === 'number' || note.table!.headers[ci]?.type === 'percent' || note.table!.headers[ci]?.type === 'temperature'
                        }"
                      >
                        <TempText v-if="note.table!.headers[ci]?.type === 'temperature'" :text="String(cell)" />
                        <template v-else-if="note.table!.headers[ci]?.type === 'percent'">{{ cell }}%</template>
                        <template v-else>{{ cell }}</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="note.table.source" class="sn-table-source">
                <template v-for="(seg, si) in parseSourceSegments(note.table.source)" :key="si">
                  <a
                    v-if="seg.kind === 'url'"
                    :href="seg.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="sn-table-source-link"
                  >{{ seg.value }}</a>
                  <template v-else>{{ seg.value }}</template>
                </template>
              </p>
            </div>
          </div>
        </div>

        <p class="text-xs text-stone-400 mt-3 italic">
          Done when: {{ state.exit_condition }}
        </p>

        <StepNote
          v-if="stepNote"
          :note="stepNote.note"
          :date="stepNote.date"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   State note structured tables (PF-180) — Variant B
   Bottom borders only, subtle mono uppercase header, zebra
   ============================================================ */

.sn-table-block {
  margin-top: 0.5rem;
}

.sn-table-block--has-text {
  margin-top: 0.625rem;
}

.sn-table-caption {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-stone-600);
  margin: 0 0 0.375rem;
}

.sn-table-scroll {
  overflow-x: auto;
}

.sn-table {
  width: 100%;
  max-width: 28rem;
  border-collapse: collapse;
}

.sn-th {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-stone-400);
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid var(--color-stone-300);
  background: transparent;
  white-space: nowrap;
}

.sn-th-right {
  text-align: right;
}

.sn-td {
  font-size: 0.875rem;
  color: var(--color-stone-800);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-stone-100);
}

.sn-table tbody tr:nth-child(odd) {
  background: var(--color-stone-50);
}

.sn-td-right {
  text-align: right;
}

.sn-td-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
}

.sn-table-source {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-stone-400);
  margin: 0.5rem 0 0;
  word-break: break-word;
}

.sn-table-source-link {
  color: var(--color-stone-500);
  text-decoration: underline;
  text-underline-offset: 0.125em;
  transition: color 150ms ease;
}

.sn-table-source-link:hover,
.sn-table-source-link:focus-visible {
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .sn-th,
  .sn-td {
    padding: 0.4375rem 0.5rem;
  }

  .sn-td {
    font-size: 0.8125rem;
  }
}
</style>
