import { Minus, Plus } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import { fieldErrorClassName, textInputClassName } from '../../../components/styles'
import type { RecipeFormValues } from '../../../types/database'
import { addRowButtonClassName, editorListClassName, removeRowButtonClassName, rowActionsClassName } from './editorStyles'
import { RowMoveButtons } from './RowMoveButtons'
import { RECIPE_LIMITS } from '../recipeLimits'

type EditorProps = {
  values: string[]
  register: UseFormRegister<RecipeFormValues>
  onAppend: () => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
  error?: string
  disabled?: boolean
}

export function StepEditor({ values, register, onAppend, onRemove, onMove, error, disabled = false }: EditorProps) {
  return (
    <div className={editorListClassName}>
      {values.map((_value, index) => (
        <div className="flex items-start gap-2.25" key={`step-${index}`}>
          <span className="mt-2 grid size-6.5 flex-none place-items-center rounded-full bg-primary-soft text-12 font-extrabold text-primary">{index + 1}</span>
          <textarea
            className={`${textInputClassName({ size: 'step' })} flex-1`}
            disabled={disabled}
            rows={2}
            placeholder={index === 0 ? '例：玉ねぎを薄切りにする' : '手順を入力'}
            {...register(`steps.${index}`)}
          />
          <div className={`${rowActionsClassName} mt-2`}>
            <RowMoveButtons label="手順" index={index} count={values.length} onMove={onMove} disabled={disabled} />
            <button
              type="button"
              className={removeRowButtonClassName}
              disabled={disabled}
              onClick={() => onRemove(index)}
              aria-label={`手順${index + 1}を削除`}
            >
              <Minus size={16} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className={addRowButtonClassName} disabled={disabled || values.length >= RECIPE_LIMITS.lines} onClick={onAppend}>
        <Plus size={16} /> 手順を追加
      </button>
      {error ? <span className={fieldErrorClassName}>{error}</span> : null}
    </div>
  )
}
