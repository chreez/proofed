<script setup lang="ts">
import { ref } from 'vue'
import { Bell, X } from 'lucide-vue-next'
import type { StepReminder } from '@/types/recipe'

const props = defineProps<{
  stepId: string
  stepTitle: string
  reminders: StepReminder[]
  isReminderDismissed: (stepId: string, prompt: string) => boolean
}>()

const emit = defineEmits<{
  respond: [stepId: string, prompt: string, value: string]
  dismiss: [stepId: string, prompt: string]
}>()

const responses = ref<Record<string, string>>({})

function handleRespond(prompt: string): void {
  const value = responses.value[prompt]
  if (value?.trim()) {
    emit('respond', props.stepId, prompt, value)
  }
}

function handleDismiss(prompt: string): void {
  emit('dismiss', props.stepId, prompt)
}
</script>

<template>
  <div class="space-y-2 mb-3">
    <template v-for="reminder in reminders" :key="reminder.prompt">
      <Transition name="slide-down">
        <div
          v-if="!isReminderDismissed(stepId, reminder.prompt)"
          class="bg-cream border-2 border-accent p-3"
        >
          <div class="flex items-start gap-3">
            <Bell class="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-xs text-crust-dark">reminder</span>
                <span
                  v-if="reminder.type"
                  class="font-mono text-[10px] text-stone-400 border border-stone-300 px-1.5 py-0.5"
                >{{ reminder.type }}</span>
              </div>
              <p class="text-sm text-stone-700 mb-2">{{ reminder.prompt }}</p>
              <div class="flex gap-2">
                <input
                  v-model="responses[reminder.prompt]"
                  class="flex-1 border-2 border-stone-200 p-2 text-base md:text-sm bg-surface rounded-none"
                  :placeholder="reminder.type === 'measurement' ? 'e.g. 748g' : reminder.type === 'rating' ? 'good / ok / bad' : 'Your observation...'"
                  @keydown.enter="handleRespond(reminder.prompt)"
                />
                <button
                  class="btn-primary text-xs py-1 px-3"
                  @click="handleRespond(reminder.prompt)"
                >Log</button>
              </div>
            </div>
            <button
              class="text-stone-400 hover:text-ink flex-shrink-0"
              title="Dismiss reminder"
              @click="handleDismiss(reminder.prompt)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </Transition>
    </template>
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
