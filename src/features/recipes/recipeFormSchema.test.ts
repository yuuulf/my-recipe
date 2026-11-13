import { describe, expect, it } from 'vitest'
import type { RecipeFormValues } from '../../types/database'
import { recipeSchema } from './recipeFormSchema'
import { RECIPE_LIMITS } from './recipeLimits'

const valid: RecipeFormValues = {
  title: 'だし巻き卵',
  description: '',
  ingredients: ['卵 3個'],
  steps: ['巻く'],
  tags: [],
  cookingTimeMinutes: undefined,
  servings: undefined,
  sourceUrl: '',
  memo: '',
}

const text = (length: number) => 'あ'.repeat(length)
const rows = (count: number, length = 1) => Array.from({ length: count }, () => text(length))

// The error messages, keyed by field ('' for the whole form).
const errorsFor = (values: Partial<RecipeFormValues>) => {
  const result = recipeSchema.safeParse({ ...valid, ...values })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0] ?? ''), issue.message]))
}

describe('recipeSchema', () => {
  it('accepts a recipe with only the required fields', () => {
    expect(errorsFor({})).toEqual({})
  })

  it('requires a title that is not only spaces', () => {
    expect(errorsFor({ title: '' })).toEqual({ title: '料理名を入力してください。' })
    expect(errorsFor({ title: '   ' })).toEqual({ title: '料理名を入力してください。' })
  })

  it('accepts every field at its limit', () => {
    expect(errorsFor({
      title: text(RECIPE_LIMITS.title),
      description: text(RECIPE_LIMITS.description),
      ingredients: rows(RECIPE_LIMITS.lines, RECIPE_LIMITS.ingredientLine),
      steps: rows(RECIPE_LIMITS.lines, RECIPE_LIMITS.stepLine),
      tags: rows(RECIPE_LIMITS.tags, RECIPE_LIMITS.tag),
      cookingTimeMinutes: RECIPE_LIMITS.cookingTimeMinutes,
      servings: RECIPE_LIMITS.servings,
      sourceUrl: `https://example.com/${'a'.repeat(RECIPE_LIMITS.sourceUrl - 20)}`,
      memo: text(RECIPE_LIMITS.memo),
    })).toEqual({})
  })

  it('rejects text one character over its limit', () => {
    expect(errorsFor({ title: text(101) })).toEqual({ title: '料理名は100文字以内にしてください。' })
    expect(errorsFor({ description: text(501) })).toEqual({ description: 'ひとこと説明は500文字以内にしてください。' })
    expect(errorsFor({ memo: text(2001) })).toEqual({ memo: 'メモは2,000文字以内にしてください。' })
    expect(errorsFor({ sourceUrl: `https://example.com/${'a'.repeat(1981)}` })).toEqual({ sourceUrl: '参考URLは2,000文字以内にしてください。' })
  })

  it('checks the number and length of ingredient and step rows', () => {
    expect(errorsFor({ ingredients: rows(51) })).toEqual({ ingredients: '材料は50行までにしてください。' })
    expect(errorsFor({ steps: rows(51) })).toEqual({ steps: '作り方は50行までにしてください。' })
    // The message names the row, counting empty rows too.
    expect(errorsFor({ ingredients: ['卵', '', text(101)] })).toEqual({ ingredients: '材料は1行100文字以内にしてください（3行目）。' })
    expect(errorsFor({ steps: [text(501)] })).toEqual({ steps: '作り方は1行500文字以内にしてください（1行目）。' })
  })

  it('does not count empty rows, which are dropped when saving', () => {
    expect(errorsFor({ ingredients: [...rows(50), '', '   '] })).toEqual({})
    // Spaces around a row are not counted either.
    expect(errorsFor({ ingredients: [`  ${text(100)}  `] })).toEqual({})
  })

  it('checks the number and length of tags', () => {
    expect(errorsFor({ tags: rows(11) })).toEqual({ tags: 'タグは10個までにしてください。' })
    expect(errorsFor({ tags: ['和食', text(21)] })).toEqual({ tags: `タグは20文字以内にしてください（#${text(21)}）。` })
  })

  it('checks the range of cooking time and servings', () => {
    expect(errorsFor({ cookingTimeMinutes: 4321 })).toEqual({ cookingTimeMinutes: '調理時間は4,320分以内にしてください。' })
    expect(errorsFor({ servings: 101 })).toEqual({ servings: '人数は100人分以内にしてください。' })
    expect(errorsFor({ cookingTimeMinutes: 0 })).toEqual({ cookingTimeMinutes: '0より大きい値を入力してください。' })
    expect(errorsFor({ servings: 1.5 })).toEqual({ servings: '整数で入力してください。' })
    expect(errorsFor({ cookingTimeMinutes: Number.NaN })).toEqual({ cookingTimeMinutes: '数値を入力してください。' })
  })

  it('accepts only http and https URLs with something after the scheme', () => {
    expect(errorsFor({ sourceUrl: 'http://example.com' })).toEqual({})
    expect(errorsFor({ sourceUrl: 'HTTPS://EXAMPLE.COM' })).toEqual({})
    const message = 'http:// または https:// から始まるURLを入力してください。'
    expect(errorsFor({ sourceUrl: 'https://' })).toEqual({ sourceUrl: message })
    expect(errorsFor({ sourceUrl: 'example.com' })).toEqual({ sourceUrl: message })
    expect(errorsFor({ sourceUrl: 'ftp://example.com' })).toEqual({ sourceUrl: message })
  })
})
