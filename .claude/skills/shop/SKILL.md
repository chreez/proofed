---
name: shop
description: Use when user wants to build an HEB shopping list from a recipe, check ingredient availability, or price out a bake
user-invocable: true
allowed-tools: Read, Glob, Bash, AskUserQuestion, mcp__heb__heb_store_lookup, mcp__heb__heb_product_search
model: sonnet
argument-hint: <recipe-id> [store-id]
---

# HEB Shopping List

Build a priced shopping list from a recipe's ingredients. Extracts all ingredients from recipe JSON, lets user mark what they already have, searches HEB MCP for availability and pricing, compiles final list, copies to clipboard.

## Usage

```
/shop gochujang-garlic-buns
/shop simple-sourdough 218
/shop
```

- If no recipe ID, read `public/recipes/index.json` and present list for selection.
- If no store ID, ask user for location and run `heb_store_lookup` to find nearest store.

## Phase 1: Extract Ingredients

1. Read `public/recipes/{recipe-id}.json`
2. Walk all `stages[].gather.ingredients[]` — collect every ingredient
3. **Consolidate duplicates** — same ingredient appearing in multiple stages gets summed (e.g., butter in dough + butter in glaze = total butter)
4. Also note **vessels** and **equipment** from `stages[].gather.vessels[]` and `stages[].gather.equipment[]`

Present a full table:

```
| # | Ingredient | Amount | Stage(s) |
|---|-----------|--------|----------|
| 1 | Bread Flour | 416g | Tangzhong + Dough |
| 2 | Unsalted Butter | 58g total | Dough (28g) + Glaze (30g) |
...
```

List vessels and equipment below the table for reference.

## Phase 2: Inventory Check

Ask user to mark what they need to buy. Present the numbered list and wait for response.

User responds with numbers and notes, e.g.:
```
1, 5, 6, 7 - want caster sugar specifically, 12 - needs to be light soy
```

Clarify any questions the user raises about substitutions or specifics before proceeding.

## Phase 3: Find HEB Store

If store ID not provided as argument:

1. Ask user for location (zip, address, or landmark like "parmer")
2. Run `heb_store_lookup` with their input
3. Present nearest stores, confirm which one

## Phase 4: HEB Product Search

For each item on the buy list:

1. Run `heb_product_search` with ingredient name at selected store
2. If specialty item returns few results, try alternate search terms (e.g., "caster sugar" → "superfine sugar")
3. Collect: product name, brand, size, price, in-stock status

Run all searches in parallel where possible.

Present results as a table with **one recommended pick per item** (best value, in stock):

```
| # | Item | Pick | Price |
|---|------|------|-------|
| 1 | Garlic | Fresh Garlic (whole head) | 2/$1.00 |
| 5 | Whole Milk | H-E-B Whole Milk (1 gal) | $4.26 |
...

Total: ~$XX.XX
```

If an item is out of stock or unavailable, flag it and suggest alternatives.

## Phase 5: Finalize & Clipboard

After user confirms the list (may remove items, swap picks):

1. Format final list as plain text
2. Copy to clipboard via `pbcopy`
3. Report item count and total

Clipboard format:
```
HEB {Store Name} (#{store-id}) — {Recipe Name}

1. {Product} ({size}) — ${price}
2. {Product} ({size}) — ${price}
...

Total: ~${total}
```

## Known Limitations

- **HEB MCP returns curbside/online inventory, not shelf stock.** The API uses `shoppingContext: CURBSIDE_PICKUP` — a product showing "in stock" may not be on the physical shelf (and vice versa). Specialty non-food items (cookware, bakeware, gadgets) are especially unreliable. Warn the user: availability is approximate, not guaranteed.

## Rules

- **User drives the list.** Never assume what they have or need — always ask.
- **One store per run.** Don't mix results across stores.
- **Flag substitution questions.** If the recipe calls for something specific (e.g., "CJ Haechandeul gochujang") and HEB has a different brand, note it.
- **Parallel searches.** Batch all `heb_product_search` calls in one round when possible.
- **Always copy to clipboard.** Long lists are impossible to copy from terminal output.
- **User can adjust anytime.** If they add/remove items mid-flow, update and re-copy.
