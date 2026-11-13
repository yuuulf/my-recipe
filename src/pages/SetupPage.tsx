import { ArrowLeft, ArrowRight, BookOpen, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { alertErrorClassName, backLinkClassName, eyebrowClassName, fieldLabelClassName, textInputClassName } from '../components/styles'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { RECIPE_NOTE_NAME_MAX } from '../features/groups/recipeNoteLimits'

export function SetupPage() {
  const { createGroup, groups, groupLoading, user, isDemoUser } = useApp()
  const navigate = useNavigate()
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isDemoUser) return <Navigate to="/recipes" replace />
  if (groupLoading) return <PageLoader />

  // A user who already belongs to a recipe note is creating another one.
  const hasNotes = groups.length > 0

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await createGroup(groupName)
      navigate('/recipes', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'レシピノートを作成できませんでした。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-primary-soft px-5 py-7.5">
      <div className="absolute -top-67.5 -right-40 size-150 rounded-full border border-primary/13" />
      <div className="absolute -bottom-87.5 -left-65 size-170 rounded-full border border-primary/13" />
      <div className="relative z-1 w-[min(470px,100%)] rounded-lg border border-border bg-white/96 px-5.5 py-7.5 shadow-md sm:p-10.5">
        {hasNotes ? <Link to="/recipes" className={`${backLinkClassName} mb-5`}><ArrowLeft size={17} /> 戻る</Link> : null}
        <div className="mb-5.75 grid size-12.25 place-items-center rounded-md bg-primary-soft text-primary"><BookOpen size={25} /></div>
        {hasNotes ? null : <span className={eyebrowClassName}>ONE LAST STEP</span>}
        <h1 className="mt-3 mb-2.5 text-26 font-bold tracking-[-.045em] text-text sm:text-30">{hasNotes ? '新しいレシピノートを作る' : 'レシピノートをつくりましょう'}</h1>
        <p className="mb-6.5 text-14 leading-[1.85] text-text-secondary">{hasNotes ? '新しいレシピノートに名前をつけます。作ったレシピノートが開きます。' : '家族や友人と共有するレシピノートに名前をつけます。'}</p>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className={fieldLabelClassName} htmlFor="group-name">レシピノートの名前</label>
          <input id="group-name" className={textInputClassName({ size: 'tall' })} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例：我が家のレシピ" autoFocus required />
          {/* No maxLength, so a pasted long name is not cut silently; createGroup reports it. */}
          <p className={`mt-1.5 text-right text-12 tabular-nums ${groupName.trim().length > RECIPE_NOTE_NAME_MAX ? 'text-danger' : 'text-text-muted'}`}>{groupName.length} / {RECIPE_NOTE_NAME_MAX}</p>
          {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
          <Button className="mt-4.25 w-full" size="lg" type="submit" loading={isSubmitting}>レシピノートを作成 <ArrowRight size={17} /></Button>
        </form>
        <div className="mt-6.75 grid gap-2.25 border-t border-border pt-5 text-12 text-text-secondary">
          <div className="flex items-center gap-1.75"><UsersRound size={16} className="text-primary" /><span>あとからメンバーを招待できます</span></div>
          <div className="flex items-center gap-1.75"><BookOpen size={16} className="text-primary" /><span>{user?.email} で作成します</span></div>
        </div>
      </div>
    </div>
  )
}
