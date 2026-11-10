import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MouseEvent } from 'react'
import { moveRowButtonClassName } from './editorStyles'

type Direction = 'up' | 'down'

type RowMoveButtonsProps = {
  // Used in the accessible names, such as 材料2を上へ移動.
  label: '材料' | '手順'
  index: number
  count: number
  onMove: (from: number, to: number) => void
  disabled?: boolean
}

const directionLabels: Record<Direction, string> = { up: '上へ', down: '下へ' }

// Rows are keyed by index, so the clicked button stays in the old row after a
// move. Move focus to the same button in the row the item moved to, or to the
// other button there when that one is now disabled (the row became first or last).
const focusMovedRow = (doc: Document, label: string, index: number, direction: Direction) => {
  const find = (dir: Direction) => doc.querySelector<HTMLButtonElement>(
    `button[data-row-label="${label}"][data-row-index="${index}"][data-row-move="${dir}"]`,
  )
  const target = find(direction)
  const fallback = find(direction === 'up' ? 'down' : 'up')
  const next = target && !target.disabled ? target : fallback
  if (next && !next.disabled) next.focus()
}

export function RowMoveButtons({ label, index, count, onMove, disabled = false }: RowMoveButtonsProps) {
  const handleMove = (direction: Direction) => (event: MouseEvent<HTMLButtonElement>) => {
    const to = direction === 'up' ? index - 1 : index + 1
    if (to < 0 || to >= count) return
    const doc = event.currentTarget.ownerDocument
    onMove(index, to)
    requestAnimationFrame(() => focusMovedRow(doc, label, to, direction))
  }

  const renderButton = (direction: Direction) => {
    const atEdge = direction === 'up' ? index === 0 : index === count - 1
    const Icon = direction === 'up' ? ChevronUp : ChevronDown
    return (
      <button
        type="button"
        className={moveRowButtonClassName}
        disabled={disabled || atEdge}
        onClick={handleMove(direction)}
        aria-label={`${label}${index + 1}を${directionLabels[direction]}移動`}
        data-row-label={label}
        data-row-index={index}
        data-row-move={direction}
      >
        <Icon size={16} />
      </button>
    )
  }

  return (
    <>
      {renderButton('up')}
      {renderButton('down')}
    </>
  )
}
