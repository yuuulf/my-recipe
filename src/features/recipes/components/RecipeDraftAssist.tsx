import { ChevronDown, Sparkles } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../../../components/Button'
import { alertErrorClassName, textInputClassName } from '../../../components/styles'
import { getErrorMessage } from '../../../lib/errors'
import { createRecipeDraft, RECIPE_DRAFT_MAX_LENGTH, type RecipeDraft } from '../api/recipeDraft'

type RecipeDraftAssistProps = {
  // True when the form already has the user's input; the draft then needs confirmation.
  hasInput: boolean
  // True in the demo, where the draft is not available.
  disabled: boolean
  onApply: (draft: RecipeDraft) => void
}

const noteClassName = 'rounded-md border border-primary/20 bg-primary-soft px-3.25 py-2.75 text-13 leading-[1.6] text-primary-hover'

// Pastes a recipe text, asks the AI for a draft, and puts it into the form.
// Nothing is saved here; the user checks the form and saves as usual.
export function RecipeDraftAssist({ hasInput, disabled, onApply }: RecipeDraftAssistProps) {
  const panelId = useId()
  const textId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingDraft, setPendingDraft] = useState<RecipeDraft | null>(null)
  const tooLong = text.length > RECIPE_DRAFT_MAX_LENGTH

  const apply = (draft: RecipeDraft) => {
    onApply(draft)
    setPendingDraft(null)
    setOpen(false)
  }

  const handleCreate = async () => {
    setError('')
    setPendingDraft(null)
    setLoading(true)
    try {
      const draft = await createRecipeDraft(text)
      if (hasInput) setPendingDraft(draft)
      else apply(draft)
    } catch (draftError) {
      setError(getErrorMessage(draftError, '下書きを作れませんでした。'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-7.25 rounded-lg border border-border bg-surface sm:mb-9">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-15 font-bold text-text sm:px-5"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Sparkles className="flex-none text-primary" size={18} aria-hidden="true" />
        <span className="flex-1">文章から下書きを作る</span>
        <ChevronDown className={`flex-none text-text-muted transition-transform duration-180 ease-[ease] ${open ? 'rotate-180' : ''}`} size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div id={panelId} className="border-t border-border px-4 pt-3.5 pb-4.5 sm:px-5">
          <label className="mb-2 block text-14 leading-[1.6] text-text-secondary" htmlFor={textId}>
            レシピの文章を貼り付けると、AIがフォームに下書きを入れます。
          </label>
          <textarea
            id={textId}
            className={textInputClassName({ error: tooLong })}
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="レシピサイトやメモの文章を貼り付けてください"
            disabled={loading || disabled}
          />
          <p className={`mt-1.5 text-right text-12 tabular-nums ${tooLong ? 'text-danger' : 'text-text-muted'}`} aria-live="polite">
            {text.length.toLocaleString('ja-JP')} / {RECIPE_DRAFT_MAX_LENGTH.toLocaleString('ja-JP')}
          </p>

          {disabled ? <p className={`${noteClassName} mt-2`} role="note">デモモードではAIの下書きは使えません。</p> : null}
          {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}

          {pendingDraft ? (
            <div className="mt-3 rounded-md border border-border bg-surface-muted px-3.25 py-3" role="alert">
              <p className="text-14 leading-[1.6] text-text">入力済みの内容を下書きで置き換えます。</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Button type="button" size="compact-short" onClick={() => apply(pendingDraft)}>置き換える</Button>
                <Button type="button" variant="secondary" size="compact-short" onClick={() => setPendingDraft(null)}>やめる</Button>
              </div>
            </div>
          ) : (
            <Button type="button" className="mt-2 w-full sm:w-auto" loading={loading} disabled={disabled} onClick={() => void handleCreate()}>
              {loading ? null : <Sparkles size={16} aria-hidden="true" />} AIで下書きを作る
            </Button>
          )}

          <p className="mt-3 text-12 leading-[1.6] text-text-muted">入力した文章は、下書きを作るために外部のAIサービスに送られます。</p>
        </div>
      ) : null}
    </section>
  )
}
