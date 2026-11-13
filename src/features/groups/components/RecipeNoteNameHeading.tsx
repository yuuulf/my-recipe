import { Pencil } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../../../components/Button'
import { alertErrorClassName, iconButtonClassName, textInputClassName } from '../../../components/styles'
import { useApp } from '../../../contexts/app-context'
import { getErrorMessage } from '../../../lib/errors'
import type { Group } from '../../../types/database'
import { RECIPE_NOTE_NAME_MAX } from '../recipeNoteLimits'

type RecipeNoteNameHeadingProps = {
  group: Group
  // True for the note's owner outside the demo.
  canRename: boolean
  titleClassName: string
}

// The recipe note's name on the settings screen. Owners can rename it in place.
// Render it with key={group.id} so switching notes closes the editor.
export function RecipeNoteNameHeading({ group, canRename, titleClassName }: RecipeNoteNameHeadingProps) {
  const { renameGroup } = useApp()
  const inputId = useId()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startEditing = () => {
    setName(group.name)
    setError('')
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError('')
  }

  const save = async () => {
    if (!name.trim()) {
      setError('レシピノートの名前を入力してください。')
      return
    }
    setSaving(true)
    setError('')
    try {
      await renameGroup(group.id, name)
      setEditing(false)
    } catch (renameError) {
      setError(getErrorMessage(renameError, 'レシピノートの名前を変更できませんでした。'))
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h2 className={`${titleClassName} min-w-0 flex-1 break-words`}>{group.name}</h2>
        {canRename ? (
          <button type="button" className={iconButtonClassName({ variant: 'muted' })} onClick={startEditing} aria-label="レシピノートの名前を変更" title="名前を変更">
            <Pencil size={16} />
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-2 block text-14 font-bold text-text" htmlFor={inputId}>レシピノートの名前</label>
      <input
        id={inputId}
        className={textInputClassName()}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => {
          // Ignore keys that confirm or cancel Japanese input conversion.
          // keyCode 229 covers Safari, which ends composition before keydown.
          if (event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'Enter') {
            event.preventDefault()
            void save()
          } else if (event.key === 'Escape') {
            cancel()
          }
        }}
        disabled={saving}
        autoFocus
      />
      {/* No maxLength, so a pasted long name is not cut silently; saving shows the error instead. */}
      <p className={`mt-1.5 text-right text-12 tabular-nums ${name.trim().length > RECIPE_NOTE_NAME_MAX ? 'text-danger' : 'text-text-muted'}`}>{name.length} / {RECIPE_NOTE_NAME_MAX}</p>
      {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="compact-short" loading={saving} onClick={() => void save()}>保存</Button>
        <Button type="button" variant="secondary" size="compact-short" disabled={saving} onClick={cancel}>キャンセル</Button>
      </div>
    </div>
  )
}
