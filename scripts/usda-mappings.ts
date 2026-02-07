/**
 * USDA FoodData Central — SR Legacy nutritional data per 100g.
 * Source: https://fdc.nal.usda.gov/
 *
 * Each entry keyed by ingredient ID from recipe JSON.
 * All nutrient values are per 100g of the ingredient.
 */

export interface NutrientsPer100g {
  fdcId: number
  description: string
  calories: number       // kcal
  protein: number        // g
  totalFat: number       // g
  saturatedFat: number   // g
  carbohydrates: number  // g
  sugar: number          // g
  fiber: number          // g
  sodium: number         // mg
}

/** Weight conversion for unit: "whole" ingredients */
export const WHOLE_UNIT_GRAMS: Record<string, number> = {
  eggs: 50, // 1 large egg without shell ≈ 50g
}

export const USDA_NUTRIENTS: Record<string, NutrientsPer100g> = {
  butter: {
    fdcId: 173430,
    description: 'Butter, without salt',
    calories: 717,
    protein: 0.85,
    totalFat: 81.11,
    saturatedFat: 51.37,
    carbohydrates: 0.06,
    sugar: 0.06,
    fiber: 0,
    sodium: 11,
  },
  flour: {
    fdcId: 168894,
    description: 'Wheat flour, white, all-purpose, enriched, bleached',
    calories: 364,
    protein: 10.33,
    totalFat: 0.98,
    saturatedFat: 0.155,
    carbohydrates: 76.31,
    sugar: 0.27,
    fiber: 2.7,
    sodium: 2,
  },
  cornstarch: {
    fdcId: 169698,
    description: 'Cornstarch',
    calories: 381,
    protein: 0.26,
    totalFat: 0.05,
    saturatedFat: 0.009,
    carbohydrates: 91.27,
    sugar: 0,
    fiber: 0.9,
    sodium: 9,
  },
  granulated_sugar: {
    fdcId: 169655,
    description: 'Sugars, granulated',
    calories: 387,
    protein: 0,
    totalFat: 0,
    saturatedFat: 0,
    carbohydrates: 99.98,
    sugar: 99.80,
    fiber: 0,
    sodium: 1,
  },
  brown_sugar: {
    fdcId: 168833,
    description: 'Sugars, brown',
    calories: 380,
    protein: 0.12,
    totalFat: 0,
    saturatedFat: 0,
    carbohydrates: 98.09,
    sugar: 97.02,
    fiber: 0,
    sodium: 28,
  },
  powdered_sugar: {
    fdcId: 169656,
    description: 'Sugars, powdered',
    calories: 389,
    protein: 0,
    totalFat: 0,
    saturatedFat: 0,
    carbohydrates: 99.77,
    sugar: 97.81,
    fiber: 0,
    sodium: 2,
  },
  milk: {
    fdcId: 171265,
    description: 'Milk, whole, 3.25% milkfat',
    calories: 61,
    protein: 3.15,
    totalFat: 3.27,
    saturatedFat: 1.865,
    carbohydrates: 4.78,
    sugar: 5.05,
    fiber: 0,
    sodium: 43,
  },
  cream_cheese: {
    fdcId: 173418,
    description: 'Cheese, cream',
    calories: 342,
    protein: 5.93,
    totalFat: 34.24,
    saturatedFat: 19.29,
    carbohydrates: 5.52,
    sugar: 3.76,
    fiber: 0,
    sodium: 321,
  },
  eggs: {
    fdcId: 171287,
    description: 'Egg, whole, raw, fresh',
    calories: 143,
    protein: 12.56,
    totalFat: 9.51,
    saturatedFat: 3.126,
    carbohydrates: 0.72,
    sugar: 0.37,
    fiber: 0,
    sodium: 142,
  },
  yeast: {
    fdcId: 175043,
    description: "Leavening agents, yeast, baker's, active dry",
    calories: 325,
    protein: 40.44,
    totalFat: 7.61,
    saturatedFat: 0.98,
    carbohydrates: 41.22,
    sugar: 0,
    fiber: 26.9,
    sodium: 51,
  },
  cinnamon: {
    fdcId: 171320,
    description: 'Spices, cinnamon, ground',
    calories: 247,
    protein: 3.99,
    totalFat: 1.24,
    saturatedFat: 0.345,
    carbohydrates: 80.59,
    sugar: 2.17,
    fiber: 53.1,
    sodium: 10,
  },
  salt: {
    fdcId: 173468,
    description: 'Salt, table',
    calories: 0,
    protein: 0,
    totalFat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    sugar: 0,
    fiber: 0,
    sodium: 38758,
  },
  vanilla: {
    fdcId: 173471,
    description: 'Vanilla extract',
    calories: 288,
    protein: 0.06,
    totalFat: 0.06,
    saturatedFat: 0.01,
    carbohydrates: 12.65,
    sugar: 12.65,
    fiber: 0,
    sodium: 9,
  },

  // ── Tartine Baguette ingredients ──

  ap_flour: {
    fdcId: 168894,
    description: 'Wheat flour, white, all-purpose, enriched, bleached',
    calories: 364,
    protein: 10.33,
    totalFat: 0.98,
    saturatedFat: 0.155,
    carbohydrates: 76.31,
    sugar: 0.27,
    fiber: 2.7,
    sodium: 2,
  },
  bread_flour: {
    fdcId: 168896,
    description: 'Wheat flour, white, bread, enriched',
    calories: 361,
    protein: 11.98,
    totalFat: 1.66,
    saturatedFat: 0.244,
    carbohydrates: 72.53,
    sugar: 0.27,
    fiber: 2.4,
    sodium: 2,
  },
  water: {
    fdcId: 173647,
    description: 'Beverages, water, tap, drinking',
    calories: 0,
    protein: 0,
    totalFat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    sugar: 0,
    fiber: 0,
    sodium: 4,
  },
  starter: {
    fdcId: 0, // Derived: 100% hydration starter ≈ 50% AP flour + 50% water
    description: 'Sourdough starter, 100% hydration (derived from AP flour)',
    calories: 182,
    protein: 5.17,
    totalFat: 0.49,
    saturatedFat: 0.078,
    carbohydrates: 38.16,
    sugar: 0.14,
    fiber: 1.35,
    sodium: 3,
  },
}
