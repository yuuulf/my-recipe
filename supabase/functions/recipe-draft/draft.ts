// Checks and cleans a recipe draft returned by the model. Separate from
// index.ts so the cleaning can be tested with Vitest; it uses no Deno APIs.
// `zod` resolves through deno.json in Deno and node_modules in Node.
import { z } from 'zod'

// Keep in sync with RECIPE_DRAFT_MAX_LENGTH in src/features/recipes/api/recipeDraft.ts.
export const MAX_TEXT_LENGTH = 8000

// Same limits as the recipe form and the database, so a draft never fails the
// form's checks. Keep in sync with src/features/recipes/recipeLimits.ts and
// supabase/migrations/20261113000000_add_input_limits.sql.
export const LIMITS = {
  title: 100,
  description: 500,
  ingredientLine: 100,
  stepLine: 500,
  lines: 50,
  tag: 20,
  tags: 10,
  cookingTimeMinutes: 4320,
  servings: 100,
  sourceUrl: 2000,
  memo: 2000,
} as const

// Providers may not follow the schema exactly, so the result is checked again here.
// Missing or wrong-typed optional fields become empty instead of failing the draft.
const trimmedString = (max: number) => z.string().catch('').transform((value) => value.trim().slice(0, max))
const strings = z.array(z.unknown()).catch([]).transform((values) =>
  values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean),
)
const lines = (maxLine: number) =>
  strings.transform((values) => values.map((value) => value.slice(0, maxLine)).slice(0, LIMITS.lines))
// Out-of-range numbers become empty rather than being clamped.
const positiveInt = (max: number) => z.unknown().optional().transform((value) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max ? value : null,
)
const draftSchema = z.object({
  title: trimmedString(LIMITS.title),
  description: trimmedString(LIMITS.description),
  ingredients: lines(LIMITS.ingredientLine),
  steps: lines(LIMITS.stepLine),
  // Long tags are dropped, not cut, since a cut tag rarely makes sense.
  tags: strings.transform((values) =>
    Array.from(new Set(values.map((value) => value.replace(/^#+/, '').trim())))
      .filter((value) => value && value.length <= LIMITS.tag)
      .slice(0, LIMITS.tags),
  ),
  cookingTimeMinutes: positiveInt(LIMITS.cookingTimeMinutes),
  servings: positiveInt(LIMITS.servings),
  // A cut URL would be broken, so an over-long one is dropped.
  sourceUrl: z.string().catch('').transform((value) => value.trim())
    .transform((value) => (value.length <= LIMITS.sourceUrl && /^https?:\/\/\S+/i.test(value) ? value : '')),
  memo: trimmedString(LIMITS.memo),
})

export type RecipeDraft = z.infer<typeof draftSchema>

export const parseDraft = (content: unknown): RecipeDraft | null => {
  if (typeof content !== 'string') return null
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    return null
  }
  const result = draftSchema.safeParse(value)
  if (!result.success) return null
  const draft = result.data
  // Nothing useful was read.
  if (!draft.title && !draft.ingredients.length && !draft.steps.length) return null
  return draft
}
