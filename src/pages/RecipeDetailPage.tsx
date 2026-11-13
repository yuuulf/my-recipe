import { ArrowLeft, Clock3, Edit3, ExternalLink, FileText, MoreHorizontal, NotebookPen, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buttonClassName } from '../components/buttonStyles'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PageLoader } from '../components/Loading'
import { AppShell } from '../components/Layout/AppShell'
import { backLinkClassName, iconButtonClassName, tagClassName, tagRowClassName } from '../components/styles'
import { getMemberDisplayName, useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { deleteRecipe, getRecipe } from '../features/recipes/api/recipes'
import type { Recipe } from '../types/database'

const formatDate = (value: string) => new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date(value))

const sectionHeadingClassName = 'flex items-start gap-2.5'
const sectionNumberClassName = 'text-14 leading-[1.4] text-text-muted tabular-nums'
const sectionTitleClassName = 'text-20 font-bold tracking-[-.025em] text-text'
// Paragraphs here used the browser's default 1em margin before Preflight.
const mutedCopyClassName = 'my-3.5 text-14 text-text-secondary'
const iconTextClassName = 'inline-flex items-center gap-1.5'
const noteCardClassName = 'min-h-27.5 rounded-lg border border-border bg-surface-muted px-4.5 py-4.25 shadow-sm'
const noteHeadingClassName = 'flex items-center gap-1.75 text-14 font-bold text-primary'
const stepItemClassName = [
  'relative grid min-h-15 grid-cols-[35px_minmax(0,1fr)] gap-3.25',
  // The line that joins each step number to the next.
  'not-last:before:absolute not-last:before:top-6.75 not-last:before:-bottom-1 not-last:before:left-3 not-last:before:w-px not-last:before:bg-border',
].join(' ')

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { group, groups, members, membersLoading, selectGroup, user, isDemoUser } = useApp()
  // The member who created the recipe; a former member is shown as 「メンバー」.
  const creatorName = (userId: string) => {
    const creator = members.find((member) => member.user_id === userId)
    return creator ? getMemberDisplayName(creator, user) : 'メンバー'
  }
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    void getRecipe(id, isDemoUser)
      .then((data) => {
        if (!active) return
        if (data && group && data.group_id !== group.id) {
          // A recipe of another recipe note the user belongs to: open that note and show it.
          if (groups.some((item) => item.id === data.group_id)) {
            setRecipe(data)
            void selectGroup(data.group_id)
          } else {
            setRecipe(null)
          }
        } else {
          setRecipe(data)
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, 'レシピを読み込めませんでした。'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [group, groups, id, isDemoUser, selectGroup])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteRecipe(id, isDemoUser)
      navigate('/recipes', { replace: true })
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, '削除できませんでした。'))
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      {loading ? <PageLoader label="レシピを開いています…" /> : null}
      {!loading && (error || !recipe) ? (
        <div className="mx-auto my-17.5 max-w-162.5">
          <EmptyState
            icon={<FileText size={25} />}
            title={error || 'レシピが見つかりません'}
            description="削除されたか、アクセスできないレシピの可能性があります。"
          >
            <Link to="/recipes" className={buttonClassName('secondary')}><ArrowLeft size={16} /> 一覧に戻る</Link>
          </EmptyState>
        </div>
      ) : null}
      {!loading && recipe ? (
        <article>
          <div className="mb-6.5 flex items-center justify-between gap-5 sm:mb-7.5">
            <Link to="/recipes" className={backLinkClassName}><ArrowLeft size={17} /> レシピ一覧</Link>
            <div className="flex gap-2">
              <Link to={`/recipes/${recipe.id}/edit`} className={buttonClassName('secondary', '', 'compact')}><Edit3 size={16} /> 編集</Link>
              {!isDemoUser ? <button type="button" className={iconButtonClassName({ variant: 'danger', tall: true })} onClick={() => setShowDeleteConfirm(true)} aria-label="レシピを削除" title="削除"><Trash2 size={17} /></button> : null}
              {!isDemoUser ? <button type="button" className={`${iconButtonClassName({ tall: true })} sm:hidden`} aria-label="その他の操作"><MoreHorizontal size={18} /></button> : null}
            </div>
          </div>
          <header className="flex justify-between gap-7.5 border-b border-border pb-6.75 sm:pb-7.5">
            <div className="min-w-0">
              <h1 className="mb-2.25 text-30 leading-[1.2] font-bold tracking-[-.04em] text-text sm:text-[clamp(28px,4vw,38px)]">{recipe.title}</h1>
              {recipe.description ? <p className="text-15 leading-[1.6] text-text-secondary">{recipe.description}</p> : null}
              {/* Shown only when there is a time or serving count; the step count is clear from the numbered steps. */}
              {recipe.cooking_time_minutes || recipe.servings ? (
                <div className="mt-4.75 flex flex-wrap gap-3.75 text-14 text-text-secondary">
                  {recipe.cooking_time_minutes ? <span className={iconTextClassName}><Clock3 className="text-primary" size={17} /> {recipe.cooking_time_minutes}分</span> : null}
                  {recipe.servings ? <span className={iconTextClassName}><UsersRound className="text-primary" size={17} /> {recipe.servings}人分</span> : null}
                </div>
              ) : null}
              {recipe.tags.length ? <div className={`${tagRowClassName} mt-4`}>{recipe.tags.map((tag) => <span className={tagClassName} key={tag}>#{tag}</span>)}</div> : null}
            </div>
            <div className="hidden flex-none flex-col items-end justify-end text-text-muted sm:flex" aria-hidden="true"><span className="text-11 tracking-[.08em]">NO.</span><strong className="text-38 leading-none font-bold text-border-strong">#{String(recipe.id).slice(-2).toUpperCase()}</strong></div>
          </header>

          <div className="grid grid-cols-1 gap-7.25 border-b border-border pt-7.25 pb-7.75 sm:gap-8.75 sm:pt-8.5 sm:pb-9.5 md:grid-cols-[.82fr_1.18fr] md:gap-11">
            <section>
              <div className={sectionHeadingClassName}><span className={sectionNumberClassName}>01</span><div><h2 className={sectionTitleClassName}>材料</h2></div></div>
              {recipe.ingredients.length ? <ul className="mt-6 grid gap-3">{recipe.ingredients.map((ingredient, index) => <li className="flex items-start gap-2.5 text-14 leading-[1.55] text-text-secondary" key={`${ingredient}-${index}`}><span className="mt-0.5 size-3.75 flex-none rounded-full border border-primary/40" /> <span>{ingredient}</span></li>)}</ul> : <p className={mutedCopyClassName}>材料の記録はありません。</p>}
            </section>

            <section>
              <div className={sectionHeadingClassName}><span className={sectionNumberClassName}>02</span><div><h2 className={sectionTitleClassName}>作り方</h2></div></div>
              {recipe.steps.length ? <ol className="mt-5 grid">{recipe.steps.map((step, index) => <li className={stepItemClassName} key={`${step}-${index}`}><span className="z-1 grid size-6.25 place-items-center rounded-full bg-primary-soft text-11 font-extrabold text-primary">{String(index + 1).padStart(2, '0')}</span><p className="mt-0.5 text-14 leading-[1.7] text-text-secondary">{step}</p></li>)}</ol> : <p className={mutedCopyClassName}>作り方の記録はありません。</p>}
            </section>
          </div>

          {(recipe.memo || recipe.source_url) ? (
            <div className="grid grid-cols-1 gap-2.5 py-5.25 sm:grid-cols-2 sm:gap-3.5 sm:py-6.5">
              {recipe.memo ? <section className={noteCardClassName}><div className={noteHeadingClassName}><NotebookPen size={17} /><span>メモ</span></div><p className="mt-3 text-14 leading-[1.7] text-text-secondary">{recipe.memo}</p></section> : null}
              {recipe.source_url ? <section className={noteCardClassName}><div className={noteHeadingClassName}><ExternalLink size={17} /><span>参考URL</span></div><a className="mt-3 flex items-center gap-1.75 overflow-hidden text-13 text-ellipsis whitespace-nowrap text-primary-hover underline" href={recipe.source_url} target="_blank" rel="noreferrer">{recipe.source_url}<ExternalLink className="flex-none" size={14} /></a></section> : null}
            </div>
          ) : null}

          <footer className="flex flex-col gap-1.25 pt-1 text-12 text-text-muted sm:flex-row sm:gap-4.5">{membersLoading || recipe.group_id !== group?.id ? null : <span>登録者 {creatorName(recipe.created_by)}</span>}<span>最終更新 {formatDate(recipe.updated_at)}</span></footer>
        </article>
      ) : null}

      {showDeleteConfirm ? (
        <ConfirmDialog
          icon={<Trash2 size={20} />}
          title="レシピを削除しますか？"
          description={`「${recipe?.title}」を削除すると、元に戻せません。`}
          confirmLabel="削除する"
          loading={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      ) : null}
    </AppShell>
  )
}
