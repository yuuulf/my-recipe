import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { editableTagClassName } from '../../../components/styles'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ tags, onChange, disabled = false }: TagInputProps) {
  const [value, setValue] = useState('')

  const addTag = () => {
    const next = value.trim().replace(/^#/, '')
    if (!next || tags.includes(next)) {
      setValue('')
      return
    }
    onChange([...tags, next])
    setValue('')
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
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag()
            }
          }}
          placeholder="タグを入力してEnter"
        />
        <button type="button" className="grid size-7 flex-none place-items-center rounded-sm bg-primary-soft text-primary" disabled={disabled} onClick={addTag} aria-label="タグを追加">
          <Plus size={16} />
        </button>
      </div>
      <span className="block text-12 text-text-muted">Enter または ＋ で追加できます</span>
    </div>
  )
}
