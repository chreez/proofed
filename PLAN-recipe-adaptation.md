# PLAN: Recipe Adaptation Pipeline for ATK Cinnamon Buns

## Overview

5-agent pipeline for transforming ATK Cinnamon Buns into structured JSON.

---

## Agent 1 - Recipe Parser

### Ingredient Extraction

**CINNAMON BUNS:**
| Ingredient | Raw Amount | Notes |
|------------|------------|-------|
| Dark brown sugar | 3/4 cup (5.25 oz) | packed |
| Unsalted butter | 8 tablespoons | melted, 5 uses in buns |
| Granulated sugar | 6 tablespoons (2.67 oz) | split: filling + dough |
| Ground cinnamon | 2 teaspoons | filling |
| Ground cloves | 1/8 teaspoon | filling |
| Salt | varies | 1/8 tsp filling + 3/4 tsp dough |
| All-purpose flour | 2.75 cups (13.75 oz) | dough |
| Baking powder | 2.5 teaspoons | dough |
| Whole milk | 1.25 cups | warm to 110F |
| Instant yeast | 4 teaspoons | rapid-rise |

**GLAZE:**
| Ingredient | Raw Amount | Notes |
|------------|------------|-------|
| Cream cheese | 3 ounces | softened |
| Confectioners' sugar | 1 cup (4 oz) | |
| Unsalted butter | 2 tablespoons | melted |
| Whole milk | 2 tablespoons | room temp |
| Vanilla extract | 1/2 teaspoon | |
| Salt | 1/8 teaspoon | |

### Multi-Use Mapping

**BUTTER (10 tbsp total = 140g):**
- 1 tbsp: filling mixture
- 2 tbsp: yeast/milk mixture
- 2 tbsp: brush on rolled dough
- 1 tbsp: grease skillet
- 2 tbsp: brush tops before baking
- 2 tbsp: glaze

**GRANULATED SUGAR (6 tbsp):**
- 4 tbsp: filling mixture
- 2 tbsp: yeast/milk mixture

**SALT (1 tsp total):**
- 1/8 tsp: filling
- 3/4 tsp: dough
- 1/8 tsp: glaze

**WHOLE MILK:**
- 1.25 cups: dough (warm)
- 2 tbsp: glaze (room temp)

---

## Agent 2 - Vessel Optimizer

### Target: 5 vessels

| Vessel ID | Type | Reuse Chain |
|-----------|------|-------------|
| V1 | Small bowl | Filling mixture - holds until assembly |
| V2 | Large bowl | Dry mix → dough formation → freed after transfer |
| V3 | Medium bowl | Wet mix → freed → glaze |
| V4 | Cast iron skillet | Grease → rise → bake → serve |
| V5 | Microwave-safe bowl | Melt all butter, portion throughout |

---

## Agent 3 - Ingredient Aggregator

### Gram Conversions

| Ingredient | Total | Grams | Breakdown |
|------------|-------|-------|-----------|
| Unsalted butter | 10 tbsp | **140g** | 6 uses |
| All-purpose flour | 2.75 cups | **344g** | single |
| Dark brown sugar | 3/4 cup | **149g** | single |
| Granulated sugar | 6 tbsp | **75g** | 2 uses |
| Confectioners' sugar | 1 cup | **113g** | single |
| Whole milk | 1.25 cups + 2 tbsp | **326g** | 2 uses |
| Cream cheese | 3 oz | **85g** | single |
| Instant yeast | 4 tsp | **12g** | single |
| Baking powder | 2.5 tsp | **10g** | single |
| Ground cinnamon | 2 tsp | **5g** | single |
| Ground cloves | 1/8 tsp | **0.3g** | single |
| Salt | 1 tsp | **6g** | 3 uses |
| Vanilla extract | 1/2 tsp | **2g** | single |

### Butter Breakdown (140g)

| Use | Grams | State |
|-----|-------|-------|
| Filling mixture | 14g | MIX_FILLING |
| Yeast/milk mixture | 28g | MIX_WET |
| Brush dough | 28g | ROLL_FILL |
| Grease skillet | 14g | CUT_ARRANGE |
| Brush tops | 28g | PRE_BAKE |
| Glaze | 28g | MAKE_GLAZE |

---

## Agent 4 - State Machine

### 13 States

| ID | Name | Duration | Timer | Parallel |
|----|------|----------|-------|----------|
| S01 | MIX_FILLING | 2 min | false | false |
| S02 | MIX_DRY | 1 min | false | true |
| S03 | MIX_WET | 2 min | false | false |
| S04 | COMBINE_DOUGH | 2 min | false | false |
| S05 | KNEAD | 2 min | false | false |
| S06 | ROLL_FILL | 5 min | false | false |
| S07 | ROLL_CYLINDER | 2 min | false | false |
| S08 | CUT_ARRANGE | 3 min | false | false |
| S09 | RISE | 30 min | true | false |
| S10 | PRE_BAKE | 2 min | false | false |
| S11 | BAKE | 27 min | true | false |
| S12 | COOL | 10 min | true | false |
| S13 | MAKE_GLAZE | 3 min | false | true |
| S14 | APPLY_GLAZE | 2 min | false | false |

---

## Agent 5 - Stage Assembler

### 6 Stages

| Stage | Title | States |
|-------|-------|--------|
| PREP | Mise en Place | (gather only) |
| MIXES | Prepare Components | S01, S02, S03 |
| DOUGH | Form Dough | S04, S05 |
| ASSEMBLE | Roll and Fill | S06, S07, S08 |
| RISE_BAKE | Rise and Bake | S09, S10, S11 |
| FINISH | Cool and Glaze | S12, S13, S14 |

---

## Validation Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | All stage.states reference existing state IDs | TBD |
| 2 | Ingredient breakdown sums match totals | TBD |
| 3 | timer: true only on passive states | TBD |
| 4 | Every state has exit_condition | TBD |
| 5 | Gather covers all state components | TBD |
| 6 | Vessel count ≤ defined vessels | TBD |
| 7 | early_check_percent between 0 and 1 | TBD |
| 8 | All weights in grams | TBD |
