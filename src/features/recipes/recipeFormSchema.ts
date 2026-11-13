import { z } from 'zod'
import { formatLimit, RECIPE_LIMITS } from './recipeLimits'

// Checks for the recipe form. The same limits are enforced by the database and
// the AI draft (see recipeLimits.ts).
const optionalNumber = (max: number, maxMessage: string) =>
  z.number({ error: '数値を入力してください。' })
    .int('整数で入力してください。')
    .positive('0より大きい値を入力してください。')
    .max(max, maxMessage)
    .optional()

const maxText = (label: string, max: number) =>
  z.string().max(max, `${label}は${formatLimit(max)}文字以内にしてください。`)

// Checks the non-empty rows (empty rows are dropped when saving). Errors go to
// the list as one message, shown under the editor.
const rowList = (label: string, maxLine: number) =>
  z.array(z.string()).superRefine((values, context) => {
    const rows = values.map((value, index) => ({ value: value.trim(), index })).filter((row) => row.value)
    if (rows.length > RECIPE_LIMITS.lines) {
      context.addIssue({ code: 'custom', message: `${label}は${RECIPE_LIMITS.lines}行までにしてください。` })
      return
    }
    const tooLong = rows.find((row) => row.value.length > maxLine)
    if (tooLong) {
      context.addIssue({ code: 'custom', message: `${label}は1行${formatLimit(maxLine)}文字以内にしてください（${tooLong.index + 1}行目）。` })
    }
  })

export const recipeSchema = z.object({
  title: z.string().trim().min(1, '料理名を入力してください。').max(RECIPE_LIMITS.title, `料理名は${RECIPE_LIMITS.title}文字以内にしてください。`),
  description: maxText('ひとこと説明', RECIPE_LIMITS.description),
  ingredients: rowList('材料', RECIPE_LIMITS.ingredientLine),
  steps: rowList('作り方', RECIPE_LIMITS.stepLine),
  // Normally kept within limits by TagInput; this covers values set another way.
  tags: z.array(z.string()).superRefine((values, context) => {
    if (values.length > RECIPE_LIMITS.tags) {
      context.addIssue({ code: 'custom', message: `タグは${RECIPE_LIMITS.tags}個までにしてください。` })
      return
    }
    const tooLong = values.find((value) => value.length > RECIPE_LIMITS.tag)
    if (tooLong) context.addIssue({ code: 'custom', message: `タグは${RECIPE_LIMITS.tag}文字以内にしてください（#${tooLong}）。` })
  }),
  cookingTimeMinutes: optionalNumber(RECIPE_LIMITS.cookingTimeMinutes, `調理時間は${formatLimit(RECIPE_LIMITS.cookingTimeMinutes)}分以内にしてください。`),
  servings: optionalNumber(RECIPE_LIMITS.servings, `人数は${RECIPE_LIMITS.servings}人分以内にしてください。`),
  sourceUrl: maxText('参考URL', RECIPE_LIMITS.sourceUrl)
    .refine((value) => !value || /^https?:\/\/\S+/i.test(value), 'http:// または https:// から始まるURLを入力してください。'),
  memo: maxText('メモ', RECIPE_LIMITS.memo),
})
