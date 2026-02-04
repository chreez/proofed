# Code Style Rules

## Vue Components

- Use `<script setup lang="ts">` syntax
- Props defined with `defineProps<T>()`
- Emits defined with `defineEmits<T>()`
- Composables prefixed with `use` (e.g., `useRecipe`, `useTimer`)

## TypeScript

- Strict mode enabled
- Explicit return types on exported functions
- Interfaces over types for object shapes
- No `any` - use `unknown` if type is truly unknown

## UnoCSS

- Use theme colors from `uno.config.ts` (stone-*, crust-*, etc.)
- Prefer shortcuts defined in config over inline utilities
- Keep component-specific styles minimal

## File Organization

- One component per file
- Composables in `src/composables/`
- Types in `src/types/`
- Components in `src/components/`
