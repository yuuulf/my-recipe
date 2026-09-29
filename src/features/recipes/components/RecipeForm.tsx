import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BookOpen, Clock3, FileText, Link2, NotebookPen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/Button'
import { getErrorMessage } from '../../../lib/errors'
import type { RecipeFormValues } from '../../../types/database'
import { IngredientEditor } from './IngredientEditor'
import { StepEditor } from './StepEditor'
import { TagInput } from './TagInput'

const optionalNumber = z.number({ error: '数値を入力してください。' }).int('整数で入力してください。').positive('0より大きい値を入力してください。').optional()

const recipeSchema = z.object({
  title: z.string().trim().min(1, '料理名を入力してください。'),
  description: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
  cookingTimeMinutes: optionalNumber,
  servings: optionalNumber,
  sourceUrl: z.string().refine((value) => !value || /^https?:\/\//.test(value), 'http:// または https:// から始まるURLを入力してください。'),
  memo: z.string(),
})

const fallbackValues: RecipeFormValues = {
  title: '',
  description: '',
  ingredients: [''],
  steps: [''],
  tags: [],
  cookingTimeMinutes: undefined,
  servings: undefined,
  sourceUrl: '',
  memo: '',
}

type RecipeFormProps = {
  defaultValues?: RecipeFormValues
  submitLabel: string
  onSubmit: (values: RecipeFormValues) => Promise<void>
}

export function RecipeForm({ defaultValues, submitLabel, onSubmit }: RecipeFormProps) {
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: defaultValues ?? fallbackValues,
  })
  const ingredientValues = watch('ingredients') ?? ['']
  const stepValues = watch('steps') ?? ['']
  const tags = watch('tags')

  useEffect(() => {
    reset(defaultValues ?? fallbackValues)
  }, [defaultValues, reset])

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const submit = async (values: RecipeFormValues) => {
    setSubmitError('')
    setIsSaving(true)
    try {
      await onSubmit({
        ...values,
        ingredients: values.ingredients.filter((value) => value.trim()),
        steps: values.steps.filter((value) => value.trim()),
      })
    } catch (error) {
      setSubmitError(getErrorMessage(error, '保存できませんでした。'))
    } finally {
      setIsSaving(false)
    }
  }

  const removeIngredient = (index: number) => {
    const next = ingredientValues.filter((_value, itemIndex) => itemIndex !== index)
    setValue('ingredients', next.length ? next : [''], { shouldDirty: true })
  }

  const removeStep = (index: number) => {
    const next = stepValues.filter((_value, itemIndex) => itemIndex !== index)
    setValue('steps', next.length ? next : [''], { shouldDirty: true })
  }

  return (
    <form className="recipe-form" onSubmit={(event) => void handleSubmit(submit)(event)}>
      <div className="form-topbar">
        <Link to="/recipes" className="back-link"><ArrowLeft size={17} /> 一覧に戻る</Link>
        <Button type="submit" loading={isSaving}>{submitLabel}</Button>
      </div>

      {submitError ? <div className="alert error" role="alert">{submitError}</div> : null}

      <section className="form-section intro-section">
        <div className="section-marker"><BookOpen size={17} /></div>
        <div className="section-body">
          <span className="eyebrow">NEW RECIPE</span>
          <h1>料理の記録を残す</h1>
          <p className="section-description">あとから作りたくなるように、気軽にメモしておきましょう。</p>
          <label className="field-label required">料理名</label>
          <input className={`text-input title-input ${errors.title ? 'has-error' : ''}`} placeholder="例：豚の生姜焼き" autoFocus {...register('title')} />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
          <label className="field-label">ひとこと説明 <span>任意</span></label>
          <textarea className="text-input" rows={3} placeholder="料理の特徴や、作るきっかけなど" {...register('description')} />
        </div>
      </section>

      <section className="form-section">
        <div className="section-marker orange"><FileText size={17} /></div>
        <div className="section-body">
          <span className="eyebrow">INGREDIENTS</span>
          <h2>材料</h2>
          <p className="section-description">1行に1つずつ入力してください。</p>
          <IngredientEditor
            values={ingredientValues}
            register={register}
            onAppend={() => setValue('ingredients', [...ingredientValues, ''], { shouldDirty: true })}
            onRemove={removeIngredient}
            error={errors.ingredients?.message}
          />
        </div>
      </section>

      <section className="form-section">
        <div className="section-marker green"><NotebookPen size={17} /></div>
        <div className="section-body">
          <span className="eyebrow">METHOD</span>
          <h2>作り方</h2>
          <p className="section-description">順番に並べると、料理中にも見返しやすくなります。</p>
          <StepEditor
            values={stepValues}
            register={register}
            onAppend={() => setValue('steps', [...stepValues, ''], { shouldDirty: true })}
            onRemove={removeStep}
            error={errors.steps?.message}
          />
        </div>
      </section>

      <section className="form-section">
        <div className="section-marker blue"><Clock3 size={17} /></div>
        <div className="section-body">
          <span className="eyebrow">DETAILS</span>
          <h2>料理のメモ</h2>
          <div className="two-column-fields">
            <label className="field-label">調理時間 <span>分</span>
              <input className={`text-input compact-input ${errors.cookingTimeMinutes ? 'has-error' : ''}`} type="number" min="1" placeholder="20" {...register('cookingTimeMinutes', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
              {errors.cookingTimeMinutes ? <small className="field-error">{errors.cookingTimeMinutes.message}</small> : null}
            </label>
            <label className="field-label">人数 <span>人分</span>
              <input className={`text-input compact-input ${errors.servings ? 'has-error' : ''}`} type="number" min="1" placeholder="2" {...register('servings', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
              {errors.servings ? <small className="field-error">{errors.servings.message}</small> : null}
            </label>
          </div>
          <label className="field-label">タグ <span>任意</span></label>
          <TagInput tags={tags ?? []} onChange={(nextTags) => setValue('tags', nextTags, { shouldDirty: true })} />
          <label className="field-label"><Link2 size={15} /> 参考URL <span>任意</span></label>
          <input className={`text-input ${errors.sourceUrl ? 'has-error' : ''}`} type="url" placeholder="https://example.com/recipe" {...register('sourceUrl')} />
          {errors.sourceUrl ? <span className="field-error">{errors.sourceUrl.message}</span> : null}
          <label className="field-label">自分用メモ <span>任意</span></label>
          <textarea className="text-input" rows={4} placeholder="次に作るときのメモやアレンジなど" {...register('memo')} />
        </div>
      </section>

      <div className="form-bottom-actions">
        <Link to="/recipes" className="button button-ghost">キャンセル</Link>
        <Button type="submit" loading={isSaving}>{submitLabel}</Button>
      </div>
    </form>
  )
}
