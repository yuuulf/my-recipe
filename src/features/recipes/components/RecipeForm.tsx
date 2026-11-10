import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BookOpen, Clock3, FileText, Link2, NotebookPen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../../components/Button'
import { buttonClassName } from '../../../components/buttonStyles'
import {
  alertErrorClassName,
  backLinkClassName,
  fieldErrorClassName,
  fieldLabelClassName,
  requiredMarkClassName,
  textInputClassName,
} from '../../../components/styles'
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

const sectionClassName = 'mb-7.25 grid grid-cols-1 gap-3 border-b border-border pb-7.75 sm:mb-9 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-4.5 sm:pb-10'
const sectionMarkerClassName = (tone: 'primary' | 'info' = 'primary') =>
  `grid size-7.75 place-items-center rounded-md sm:size-8.5 ${tone === 'info' ? 'bg-info-soft text-info' : 'bg-primary-soft text-primary'}`
const sectionHeadingClassName = 'mt-1.25 mb-1.75 font-bold tracking-[-.03em] text-text'
// Keeps the 22px gap between a section heading and its row editor.
const sectionBodyClassName = 'mt-3.75'
const numberInputClassName = (error: boolean) => `${textInputClassName({ error, fullWidth: false })} mt-1.75 block w-full sm:w-32.5`

type RecipeFormProps = {
  defaultValues?: RecipeFormValues
  submitLabel: string
  onSubmit: (values: RecipeFormValues) => Promise<void>
  disableSave?: boolean
}

export function RecipeForm({ defaultValues, submitLabel, onSubmit, disableSave = false }: RecipeFormProps) {
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
    if (!isDirty || disableSave) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [disableSave, isDirty])

  const submit = async (values: RecipeFormValues) => {
    if (disableSave) return
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
    <form className="mx-auto max-w-210" onSubmit={(event) => void handleSubmit(submit)(event)}>
      <div className="mb-7.5 flex items-center justify-between gap-5 sm:mb-9">
        <Link to="/recipes" className={backLinkClassName}><ArrowLeft size={17} /> 一覧に戻る</Link>
        <Button type="submit" size="compact-short" loading={isSaving} disabled={disableSave}>{submitLabel}</Button>
      </div>

      {disableSave ? <div className="mb-6 rounded-md border border-primary/20 bg-primary-soft px-3.25 py-2.75 text-13 leading-[1.6] text-primary-hover" role="note">デモモードではレシピを閲覧・編集できますが、変更は保存できません。</div> : null}
      {submitError ? <div className={alertErrorClassName} role="alert">{submitError}</div> : null}

      <section className={sectionClassName}>
        <div className={sectionMarkerClassName()}><BookOpen size={17} /></div>
        <div>
          <h1 className={`${sectionHeadingClassName} text-26 sm:text-28`}>料理の記録を残す</h1>
          <label className={`${fieldLabelClassName} ${requiredMarkClassName}`}>料理名</label>
          <input className={textInputClassName({ error: Boolean(errors.title), size: 'title' })} placeholder="例：豚の生姜焼き" autoFocus {...register('title')} />
          {errors.title ? <span className={fieldErrorClassName}>{errors.title.message}</span> : null}
          <label className={fieldLabelClassName}>ひとこと説明 <span>任意</span></label>
          <textarea className={textInputClassName()} rows={3} placeholder="料理の特徴や、作るきっかけなど" {...register('description')} />
        </div>
      </section>

      <section className={sectionClassName}>
        <div className={sectionMarkerClassName()}><FileText size={17} /></div>
        <div>
          <h2 className={`${sectionHeadingClassName} text-20`}>材料</h2>
          <div className={sectionBodyClassName}>
            <IngredientEditor
              values={ingredientValues}
              register={register}
              onAppend={() => setValue('ingredients', [...ingredientValues, ''], { shouldDirty: true })}
              onRemove={removeIngredient}
              error={errors.ingredients?.message}
            />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className={sectionMarkerClassName()}><NotebookPen size={17} /></div>
        <div>
          <h2 className={`${sectionHeadingClassName} text-20`}>作り方</h2>
          <div className={sectionBodyClassName}>
            <StepEditor
              values={stepValues}
              register={register}
              onAppend={() => setValue('steps', [...stepValues, ''], { shouldDirty: true })}
              onRemove={removeStep}
              error={errors.steps?.message}
            />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className={sectionMarkerClassName('info')}><Clock3 size={17} /></div>
        <div>
          <h2 className={`${sectionHeadingClassName} text-20`}>料理のメモ</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            <label className={fieldLabelClassName}>調理時間 <span>分</span>
              <input className={numberInputClassName(Boolean(errors.cookingTimeMinutes))} type="number" min="1" placeholder="20" {...register('cookingTimeMinutes', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
              {errors.cookingTimeMinutes ? <small className={`${fieldErrorClassName} font-[450]`}>{errors.cookingTimeMinutes.message}</small> : null}
            </label>
            <label className={fieldLabelClassName}>人数 <span>人分</span>
              <input className={numberInputClassName(Boolean(errors.servings))} type="number" min="1" placeholder="2" {...register('servings', { setValueAs: (value) => value === '' ? undefined : Number(value) })} />
              {errors.servings ? <small className={`${fieldErrorClassName} font-[450]`}>{errors.servings.message}</small> : null}
            </label>
          </div>
          <label className={fieldLabelClassName}>タグ <span>任意</span></label>
          <TagInput tags={tags ?? []} onChange={(nextTags) => setValue('tags', nextTags, { shouldDirty: true })} />
          <label className={fieldLabelClassName}><Link2 size={15} /> 参考URL <span>任意</span></label>
          <input className={textInputClassName({ error: Boolean(errors.sourceUrl) })} type="url" placeholder="https://example.com/recipe" {...register('sourceUrl')} />
          {errors.sourceUrl ? <span className={fieldErrorClassName}>{errors.sourceUrl.message}</span> : null}
          <label className={fieldLabelClassName}>メモ <span>任意</span></label>
          <textarea className={textInputClassName()} rows={4} placeholder="次に作るときのメモやアレンジなど" {...register('memo')} />
        </div>
      </section>

      <div className="flex justify-end gap-2.5 pb-7.5">
        <Link to="/recipes" className={buttonClassName('ghost')}>キャンセル</Link>
        <Button type="submit" loading={isSaving} disabled={disableSave}>{submitLabel}</Button>
      </div>
    </form>
  )
}
