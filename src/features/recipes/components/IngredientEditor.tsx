import { Minus, Plus } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import type { RecipeFormValues } from '../../../types/database'

type EditorProps = {
  values: string[]
  register: UseFormRegister<RecipeFormValues>
  onAppend: () => void
  onRemove: (index: number) => void
  error?: string
}

export function IngredientEditor({ values, register, onAppend, onRemove, error }: EditorProps) {
  return (
    <div className="editor-list">
      {values.map((_value, index) => (
        <div className="editor-row" key={`ingredient-${index}`}>
          <span className="editor-index">{String(index + 1).padStart(2, '0')}</span>
          <input
            className="text-input"
            placeholder={index === 0 ? '例：豚ロース薄切り 300g' : '材料を入力'}
            {...register(`ingredients.${index}`)}
          />
          <button
            type="button"
            className="remove-button"
            onClick={() => onRemove(index)}
            aria-label={`材料${index + 1}を削除`}
          >
            <Minus size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="add-row-button" onClick={onAppend}>
        <Plus size={16} /> 材料を追加
      </button>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}
