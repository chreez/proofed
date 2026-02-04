# PLAN: Vite + Vue + UnoCSS Architecture

## File Structure

```
baking-recipes/
├── index.html
├── package.json
├── vite.config.ts
├── uno.config.ts
├── tsconfig.json
│
├── public/
│   └── recipes/
│       ├── atk-cinnamon-buns.json
│       └── index.json
│
├── src/
│   ├── main.ts
│   ├── App.vue
│   │
│   ├── types/
│   │   └── recipe.ts
│   │
│   ├── composables/
│   │   ├── useRecipe.ts
│   │   ├── useTimer.ts
│   │   └── useProgress.ts
│   │
│   └── components/
│       ├── RecipeSelector.vue
│       ├── RecipeMeta.vue
│       ├── StageCard.vue
│       ├── GatherSection.vue
│       ├── StateStep.vue
│       ├── TimerDisplay.vue
│       ├── CheckableItem.vue
│       └── AdminView.vue (stub)
```

## Color Palette (Warm Stone)

```
stone-50:  #faf9f7  - Page background
stone-100: #f5f3ef  - Card backgrounds
stone-200: #e8e4dc  - Borders
stone-600: #7d6e58  - Primary text
stone-700: #5f5243  - Headings
crust:     #a67c52  - Accent/buttons
danger:    #a65252  - Critical notes
success:   #6b8e4e  - Completion
```

## Key Composables

### useProgress
- Track checked state per item (vessels, equipment, ingredients, states)
- Persist to localStorage
- Calculate completion percentages

### useTimer
- Start/pause/reset controls
- Early check alert at config.early_check_percent
- Completion sound/notification

### useRecipe
- Fetch manifest from /public/recipes/index.json
- Load selected recipe
- Persist last selection

## Component Responsibilities

| Component | Purpose |
|-----------|---------|
| StageCard | Collapsible stage with progress counter |
| GatherSection | Checkable vessels, equipment, ingredients |
| StateStep | Direction, timer (if passive), components, notes |
| TimerDisplay | Countdown with controls, early check alert |
| CheckableItem | Reusable checkbox with strikethrough |

## Admin Stub

Placeholder with "Coming Soon" message listing planned features:
- Recipe validation
- JSON editor
- State inspector
