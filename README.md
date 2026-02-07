<p align="center">
  <img src="assets/wordmark.svg" alt="proofed." width="200">
</p>

A developer's personal cooking notebook. Recipes as structured JSON — precise, version-tracked, and built to bake from.

## Tech Stack

- **Vite** + **Vue 3** (Composition API) + **TypeScript**
- **UnoCSS** with a warm stone palette
- **JSON-first** recipe data in `public/recipes/`

## Getting Started

```sh
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # tests + type-check + production build
```

## How It Works

Each recipe is a standalone JSON file following a strict schema: ingredients in grams, temperatures in Celsius, one physical action per state. The UI walks you through each stage — gather, prep, bake — with progress tracking, timers, and a personal cook log.

```
public/recipes/
├── index.json              # recipe manifest
├── atk-cinnamon-buns.json  # recipe data
└── ...
```

## Brand

**proofed.** — bread proofing meets proven code. JetBrains Mono meets mise en place.
