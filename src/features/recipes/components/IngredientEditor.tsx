import { Minus, Plus } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import { fieldErrorClassName, textInputClassName } from '../../../components/styles'
import type { RecipeFormValues } from '../../../types/database'
import { addRowButtonClassName, editorListClassName, removeRowButtonClassName, rowActionsClassName } from './editorStyles'
import { RowMoveButtons } from './RowMoveButtons'

type EditorProps = {
  values: string[]
  register: UseFormRegister<RecipeFormValues>
  onAppend: () => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
  error?: string
  disabled?: boolean
}

export function IngredientEditor({ values, register, onAppend, onRemove, onMove, error, disabled = false }: EditorProps) {
  return (
    <div className={editorListClassName}>
      {values.map((_value, index) => (
        <div className="flex items-center gap-2.25" key={`ingredient-${index}`}>
          <span className="w-6.5 text-center text-12 text-text-muted tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <input
            className={`${textInputClassName()} flex-1`}
            disabled={disabled}
            placeholder={index === 0 ? '例：豚ロース薄切り 300g' : '材料を入力'}
            {...register(`ingredients.${index}`)}
          />
          <div className={rowActionsClassName}>
            <RowMoveButtons label="材料" index={index} count={values.length} onMove={onMove} disabled={disabled} />
            <button
              type="button"
              className={removeRowButtonClassName}
              disabled={disabled}
              onClick={() => onRemove(index)}
              aria-label={`材料${index + 1}を削除`}
            >
              <Minus size={16} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className={addRowButtonClassName} disabled={disabled} onClick={onAppend}>
        <Plus size={16} /> 材料を追加
      </button>
      {error ? <span className={fieldErrorClassName}>{error}</span> : null}
    </div>
  )
}
