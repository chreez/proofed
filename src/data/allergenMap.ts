/**
 * Hardcoded ingredient ID → FDA Big 9 allergen mapping.
 * Based on spike research (PF-211.2).
 *
 * FDA Big 9 allergens (FALCPA + FASTER Act, effective 2023):
 * 1. Milk
 * 2. Eggs
 * 3. Fish
 * 4. Crustacean Shellfish
 * 5. Tree Nuts
 * 6. Peanuts
 * 7. Wheat
 * 8. Soybeans
 * 9. Sesame
 */

export type AllergenType =
  | 'Milk'
  | 'Eggs'
  | 'Fish'
  | 'Crustacean Shellfish'
  | 'Tree Nuts'
  | 'Peanuts'
  | 'Wheat'
  | 'Soybeans'
  | 'Sesame'

export const allergenMap: Record<string, AllergenType[]> = {
  // Dairy
  butter: ['Milk'],
  milk: ['Milk'],
  cream_cheese: ['Milk'],
  ghee: ['Milk'], // Milk-derived (trace lactose)
  cheese: ['Milk'],

  // Eggs
  eggs: ['Eggs'],

  // Wheat
  flour: ['Wheat'],
  ap_flour: ['Wheat'],
  bread_flour: ['Wheat'],
  starter: ['Wheat'], // Assumes wheat-based sourdough starter

  // Tree Nuts
  almond_flour: ['Tree Nuts'],

  // Peanuts
  peanut_butter: ['Peanuts'],

  // Soy
  soy_sauce: ['Soybeans', 'Wheat'],
  light_soy_sauce: ['Soybeans', 'Wheat'],
  miso: ['Soybeans'],
  gochujang: ['Soybeans', 'Wheat'], // CJ Haechandeul contains wheat
  worcestershire: ['Fish', 'Soybeans'], // Anchovies
  chuno_sauce: ['Soybeans'],

  // Sesame
  sesame_seeds: ['Sesame'],

  // Multi-allergen products
  curry_roux: ['Wheat', 'Peanuts', 'Milk', 'Soybeans'], // House Foods Java Curry

  // Grains (gluten-containing)
  beer: ['Wheat'], // Barley/wheat-based beer

  // Chocolate (context-dependent — spike notes say tag as Milk if <70% or check label)
  // Defaulting to empty — recipes can override via allergenOverride if using milk chocolate
  chocolate: [],

  // Non-allergen ingredients (explicitly documented as safe)
  cornstarch: [],
  rice: [],
  coconut_flour: [], // FDA does not classify coconut as tree nut
  yeast: [],
  cinnamon: [],
  salt: [],
  vanilla: [],
  sugar: [],
  granulated_sugar: [],
  brown_sugar: [],
  powdered_sugar: [],
  caster_sugar: [],
  oil: [],
  olive_oil: [],
  water: [],
  garlic: [],
  onions: [],
  carrot: [],
  apple: [],
  pork: [],
  beef_broth: [], // May contain celery (not Big 9)
  honey: [],
  curry_powder: [], // S&B Oriental Curry Powder — spice blend
  mango_chutney: [], // May contain mustard (not Big 9)
  instant_coffee: [],
  rice_vinegar: [],
  white_pepper: [],
  black_pepper: [],
  rosemary: [],
  basil: [],
  psyllium_husk: [],
  baking_powder: [],
  baking_soda: [],
  acv: [],
  lime_juice: [],
}
