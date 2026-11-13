// Input limits for recipes. The server enforces the same values: keep them in
// sync with supabase/migrations/20261113000000_add_input_limits.sql and
// supabase/functions/recipe-draft/index.ts.
export const RECIPE_LIMITS = {
  title: 100,
  description: 500,
  ingredientLine: 100,
  stepLine: 500,
  // Rows of ingredients and of steps, each.
  lines: 50,
  tag: 20,
  tags: 10,
  cookingTimeMinutes: 4320,
  servings: 100,
  sourceUrl: 2000,
  memo: 2000,
} as const

export const formatLimit = (value: number) => value.toLocaleString('ja-JP')
