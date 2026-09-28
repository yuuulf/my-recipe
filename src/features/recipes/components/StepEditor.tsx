import { GripVertical, Minus, Plus } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import type { RecipeFormValues } from '../../../types/database'

type EditorProps = {
  values: string[]
  register: UseFormRegister<RecipeFormValues>
  onAppend: () => void
  onRemove: (index: number) => void
  error?: string
}

export function StepEditor({ values, register, onAppend, onRemove, error }: EditorProps) {
  return (
    <div className="editor-list">
      {values.map((_value, index) => (
        <div className="editor-row step-row" key={`step-${index}`}>
          <span className="drag-handle" aria-hidden="true"><GripVertical size={16} /></span>
          <span className="step-number">{index + 1}</span>
          <textarea
            className="text-input step-input"
            rows={2}
            placeholder={index === 0 ? '例：玉ねぎを薄切りにする' : '手順を入力'}
            {...register(`steps.${index}`)}
          />
          <button
            type="button"
            className="remove-button"
            onClick={() => onRemove(index)}
            aria-label={`手順${index + 1}を削除`}
          >
            <Minus size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="add-row-button" onClick={onAppend}>
        <Plus size={16} /> 手順を追加
      </button>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}
