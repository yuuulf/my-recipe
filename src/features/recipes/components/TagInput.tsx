import { Plus, X } from 'lucide-react'
import { useState } from 'react'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
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
    <div className="tag-input-wrap">
      <div className="tag-input-list">
        {tags.map((tag) => (
          <span className="tag editable-tag" key={tag}>
            #{tag}
            <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} aria-label={`${tag}を削除`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="tag-entry">
        <input
          className="text-input"
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
        <button type="button" className="tag-add-button" onClick={addTag} aria-label="タグを追加">
          <Plus size={16} />
        </button>
      </div>
      <span className="helper-text">Enter または ＋ で追加できます</span>
    </div>
  )
}
