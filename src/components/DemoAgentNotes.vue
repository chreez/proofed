<script setup lang="ts">
// DISPOSABLE DEMO — delete after PF-118.2 design decision
// Shows 3 visual options for agent-sourced note rendering
import type { StateNote } from '@/types/recipe'

const userNotes: StateNote[] = [
  { text: 'Milk must be 105-115°F (40-46°C). Too hot kills yeast.', critical: true, source: 'user' },
  { text: 'Foil sling = two perpendicular sheets with overhang for lifting', critical: false, source: 'user' },
]

const agentNotes: StateNote[] = [
  { text: 'The windowpane test is the gold standard here: stretch a small piece of dough between your fingers — it should form a thin, translucent membrane without tearing. If it tears immediately, knead another 2 minutes.', critical: false, source: 'agent' },
  { text: 'Do not exceed 130°F (54°C) when proofing — yeast cells die above this threshold and the dough will not rise.', critical: true, source: 'agent' },
]

const allNotes = [...userNotes, ...agentNotes]
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-heading text-2xl font-mono mb-2">PF-118.2 Demo: Agent Note Rendering</h1>
    <p class="text-body text-sm mb-8">
      Each option shows the same 4 notes: 2 user-authored + 2 agent-sourced, each with a critical and non-critical variant.
      Pick the option that best differentiates agent notes while keeping the page cohesive.
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- OPTION A: Monospace label (mirrors voice-human pattern) -->
      <div>
        <h2 class="font-mono text-lg text-heading mb-1 border-b-2 border-stone-200 pb-2">
          Option A: Monospace Label
        </h2>
        <p class="text-xs text-muted mb-4">Agent notes get a <code>// Agent Tip</code> label, mirroring the <code>// My Note</code> pattern from cook logs.</p>
        <div class="space-y-2">
          <div
            v-for="(note, i) in allNotes"
            :key="'a-' + i"
            class="text-sm p-2"
            :class="note.critical ? 'bg-accent-tint text-accent border-l-4 border-accent' : 'bg-stone-100 text-stone-600'"
          >
            <div v-if="note.source === 'agent'" class="font-mono text-xs text-crust-dark mb-1 tracking-wide">
              // Agent Tip
            </div>
            <span v-if="note.critical" class="font-medium">⚠ </span>
            {{ note.text }}
          </div>
        </div>
      </div>

      <!-- OPTION B: Background tint -->
      <div>
        <h2 class="font-mono text-lg text-heading mb-1 border-b-2 border-stone-200 pb-2">
          Option B: Background Tint
        </h2>
        <p class="text-xs text-muted mb-4">Agent notes use a warm crust tint background instead of stone-100. Critical agent notes blend crust + accent.</p>
        <div class="space-y-2">
          <div
            v-for="(note, i) in allNotes"
            :key="'b-' + i"
            class="text-sm p-2"
            :class="[
              note.critical && note.source !== 'agent' ? 'bg-accent-tint text-accent border-l-4 border-accent' : '',
              note.critical && note.source === 'agent' ? 'bg-accent-tint text-accent border-l-4 border-crust' : '',
              !note.critical && note.source !== 'agent' ? 'bg-stone-100 text-stone-600' : '',
              !note.critical && note.source === 'agent' ? 'bg-crust-light/40 text-stone-600' : '',
            ]"
          >
            <span v-if="note.critical" class="font-medium">⚠ </span>
            {{ note.text }}
          </div>
        </div>
      </div>

      <!-- OPTION C: Left border accent -->
      <div>
        <h2 class="font-mono text-lg text-heading mb-1 border-b-2 border-stone-200 pb-2">
          Option C: Left Border + Label
        </h2>
        <p class="text-xs text-muted mb-4">Agent notes get a crust-colored left border and a subtle inline source tag. Critical agent notes keep the accent border but add the tag.</p>
        <div class="space-y-2">
          <div
            v-for="(note, i) in allNotes"
            :key="'c-' + i"
            class="text-sm p-2"
            :class="[
              note.critical ? 'bg-accent-tint text-accent border-l-4 border-accent' : '',
              !note.critical && note.source === 'agent' ? 'bg-stone-100 text-stone-600 border-l-4 border-crust' : '',
              !note.critical && note.source !== 'agent' ? 'bg-stone-100 text-stone-600' : '',
            ]"
          >
            <span v-if="note.critical" class="font-medium">⚠ </span>
            {{ note.text }}
            <span v-if="note.source === 'agent'" class="inline-block ml-1 text-xs font-mono text-crust-dark bg-crust-light/50 px-1.5 py-0.5 align-middle">
              agent
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Context: what the current user notes look like for reference -->
    <div class="mt-12 border-t-2 border-stone-200 pt-6">
      <h2 class="font-mono text-lg text-heading mb-4">Reference: Current Rendering (no source differentiation)</h2>
      <div class="max-w-xl space-y-2">
        <div
          v-for="(note, i) in allNotes"
          :key="'ref-' + i"
          class="text-sm p-2"
          :class="note.critical ? 'bg-accent-tint text-accent border-l-4 border-accent' : 'bg-stone-100 text-stone-600'"
        >
          <span v-if="note.critical" class="font-medium">⚠ </span>
          {{ note.text }}
        </div>
      </div>
    </div>
  </div>
</template>
