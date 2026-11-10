import { FunctionsHttpError } from '@supabase/supabase-js'
import { getSupabase } from '../../../lib/supabase'
import type { RecipeFormValues } from '../../../types/database'

// Keep in sync with MAX_TEXT_LENGTH in supabase/functions/recipe-draft/index.ts.
export const RECIPE_DRAFT_MAX_LENGTH = 8000

export type RecipeDraftErrorCode =
  | 'invalid_input'
  | 'unauthorized'
  | 'no_group'
  | 'not_configured'
  | 'rate_limited'
  | 'upstream_error'
  | 'unreadable'

// The draft as the Edge Function returns it, already checked and cleaned there.
type RecipeDraftResponse = {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  cookingTimeMinutes: number | null
  servings: number | null
  sourceUrl: string
  memo: string
}

export type RecipeDraft = Partial<RecipeFormValues>

const errorMessages: Record<RecipeDraftErrorCode, string> = {
  invalid_input: '文章を確かめてください。',
  unauthorized: 'ログインし直してください。',
  no_group: 'ログインし直してください。',
  not_configured: '下書きを作れませんでした。',
  rate_limited: '混み合っています。時間をおいてお試しください。',
  upstream_error: '下書きを作れませんでした。',
  unreadable: 'レシピを読み取れませんでした。',
}

export class RecipeDraftError extends Error {
  readonly code: RecipeDraftErrorCode

  constructor(code: RecipeDraftErrorCode, message = errorMessages[code]) {
    super(message)
    this.name = 'RecipeDraftError'
    this.code = code
  }
}

const isErrorCode = (value: unknown): value is RecipeDraftErrorCode =>
  typeof value === 'string' && value in errorMessages

// Reads { error: { code, message } } from the Edge Function. Requests the gateway
// rejects (for example without a token) return another shape: treat them as signed out.
const toDraftError = async (error: unknown): Promise<RecipeDraftError> => {
  if (!(error instanceof FunctionsHttpError)) return new RecipeDraftError('upstream_error')
  const response = error.context as Response
  try {
    const body: unknown = await response.json()
    const detail = (body as { error?: { code?: unknown, message?: unknown } } | null)?.error
    if (detail && isErrorCode(detail.code)) {
      // The function's message is specific for input errors (empty, too long).
      const message = detail.code === 'invalid_input' && typeof detail.message === 'string' ? detail.message : undefined
      return new RecipeDraftError(detail.code, message)
    }
  } catch {
    // Not JSON; fall through.
  }
  return new RecipeDraftError(response.status === 401 ? 'unauthorized' : 'upstream_error')
}

const toFormValues = (draft: RecipeDraftResponse): RecipeDraft => ({
  title: draft.title,
  description: draft.description,
  ingredients: draft.ingredients,
  steps: draft.steps,
  tags: draft.tags,
  cookingTimeMinutes: draft.cookingTimeMinutes ?? undefined,
  servings: draft.servings ?? undefined,
  sourceUrl: draft.sourceUrl,
  memo: draft.memo,
})

export const createRecipeDraft = async (text: string): Promise<RecipeDraft> => {
  if (!text.trim()) throw new RecipeDraftError('invalid_input', '文章を入力してください。')
  if (text.length > RECIPE_DRAFT_MAX_LENGTH) {
    throw new RecipeDraftError('invalid_input', `${RECIPE_DRAFT_MAX_LENGTH.toLocaleString('ja-JP')}文字以内にしてください。`)
  }

  const { data, error } = await getSupabase().functions.invoke<{ draft: RecipeDraftResponse }>('recipe-draft', {
    body: { text },
  })
  if (error) throw await toDraftError(error)
  if (!data?.draft) throw new RecipeDraftError('unreadable')
  return toFormValues(data.draft)
}
