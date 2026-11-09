import { GripVertical, Minus, Plus } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import { fieldErrorClassName, textInputClassName } from '../../../components/styles'
import type { RecipeFormValues } from '../../../types/database'
import { addRowButtonClassName, editorListClassName, removeRowButtonClassName } from './editorStyles'

type EditorProps = {
  values: string[]
  register: UseFormRegister<RecipeFormValues>
  onAppend: () => void
  onRemove: (index: number) => void
  error?: string
  disabled?: boolean
}

export function StepEditor({ values, register, onAppend, onRemove, error, disabled = false }: EditorProps) {
  return (
    <div className={editorListClassName}>
      {values.map((_value, index) => (
        <div className="flex items-start gap-2.25" key={`step-${index}`}>
          <span className="grid w-4 place-items-center pt-2.75 text-text-muted" aria-hidden="true"><GripVertical size={16} /></span>
          <span className="mt-2 grid size-6.5 flex-none place-items-center rounded-full bg-primary-soft text-12 font-extrabold text-primary">{index + 1}</span>
          <textarea
            className={`${textInputClassName({ size: 'step' })} flex-1`}
            disabled={disabled}
            rows={2}
            placeholder={index === 0 ? '例：玉ねぎを薄切りにする' : '手順を入力'}
            {...register(`steps.${index}`)}
          />
          <button
            type="button"
            className={`${removeRowButtonClassName} mt-2`}
            disabled={disabled}
            onClick={() => onRemove(index)}
            aria-label={`手順${index + 1}を削除`}
          >
            <Minus size={16} />
          </button>
        </div>
      ))}
      <button type="button" className={addRowButtonClassName} disabled={disabled} onClick={onAppend}>
        <Plus size={16} /> 手順を追加
      </button>
      {error ? <span className={fieldErrorClassName}>{error}</span> : null}
    </div>
  )
}
