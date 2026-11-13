import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { editableTagClassName } from '../../../components/styles'
import { RECIPE_LIMITS } from '../recipeLimits'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ tags, onChange, disabled = false }: TagInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const full = tags.length >= RECIPE_LIMITS.tags

  // Over-limit tags are not added; the text stays so the user can shorten it.
  const addTag = () => {
    const next = value.trim().replace(/^#/, '')
    if (!next || tags.includes(next)) {
      setValue('')
      setError('')
      return
    }
    if (full) {
      setError(`タグは${RECIPE_LIMITS.tags}個までです。`)
      return
    }
    if (next.length > RECIPE_LIMITS.tag) {
      setError(`タグは${RECIPE_LIMITS.tag}文字以内にしてください。`)
      return
    }
    onChange([...tags, next])
    setValue('')
    setError('')
  }

  return (
    <div className="rounded-md border border-border bg-surface px-2.75 pt-2.25 pb-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span className={editableTagClassName} key={tag}>
            #{tag}
            <button type="button" className="grid place-items-center bg-transparent p-px text-primary" disabled={disabled} onClick={() => onChange(tags.filter((item) => item !== tag))} aria-label={`${tag}を削除`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.75 flex items-center gap-1.5">
        <input
          className="min-h-10.5 w-full min-w-0 bg-surface px-0.5 py-1.75 text-14 leading-[1.6] text-text outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-72"
          disabled={disabled}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
          onKeyDown={(event) => {
            // Ignore keys that confirm Japanese input conversion.
            // keyCode 229 covers Safari, which ends composition before keydown.
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag()
            }
          }}
          placeholder="タグを入力してEnter"
        />
        <button type="button" className="grid size-7 flex-none place-items-center rounded-sm bg-primary-soft text-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled || full} onClick={addTag} aria-label="タグを追加">
          <Plus size={16} />
        </button>
      </div>
      {error
        ? <span className="block text-12 text-danger" role="alert">{error}</span>
        : <span className="block text-12 text-text-muted">{full ? `タグは${RECIPE_LIMITS.tags}個までです` : 'Enter または ＋ で追加できます'}</span>}
    </div>
  )
}
