import { ArrowLeft, Clock3, Edit3, ExternalLink, FileText, MoreHorizontal, NotebookPen, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { AppShell } from '../components/Layout/AppShell'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { deleteRecipe, getRecipe } from '../features/recipes/api/recipes'
import type { Recipe } from '../types/database'

const formatDate = (value: string) => new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date(value))

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { group, user, isDemoUser } = useApp()
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
          setRecipe(null)
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
  }, [group, id, isDemoUser])

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
        <div className="detail-not-found">
          <div className="empty-state">
            <div className="empty-icon"><FileText size={25} /></div>
            <h2>{error || 'レシピが見つかりません'}</h2>
            <p>削除されたか、アクセスできないレシピの可能性があります。</p>
            <Link to="/recipes" className="button button-secondary"><ArrowLeft size={16} /> 一覧に戻る</Link>
          </div>
        </div>
      ) : null}
      {!loading && recipe ? (
        <article className="recipe-detail">
          <div className="detail-toolbar">
            <Link to="/recipes" className="back-link"><ArrowLeft size={17} /> レシピ一覧</Link>
            <div className="detail-actions">
              <Link to={`/recipes/${recipe.id}/edit`} className="button button-secondary"><Edit3 size={16} /> 編集</Link>
              {!isDemoUser ? <button type="button" className="icon-button danger-icon" onClick={() => setShowDeleteConfirm(true)} aria-label="レシピを削除" title="削除"><Trash2 size={17} /></button> : null}
              {!isDemoUser ? <button type="button" className="icon-button more-button" aria-label="その他の操作"><MoreHorizontal size={18} /></button> : null}
            </div>
          </div>
          <header className="detail-hero">
            <div className="detail-hero-copy">
              <span className="eyebrow">最終更新 {formatDate(recipe.updated_at)}</span>
              <h1>{recipe.title}</h1>
              {recipe.description ? <p>{recipe.description}</p> : null}
              <div className="detail-meta-row">
                {recipe.cooking_time_minutes ? <span><Clock3 size={17} /> {recipe.cooking_time_minutes}分</span> : null}
                {recipe.servings ? <span><UsersRound size={17} /> {recipe.servings}人分</span> : null}
                <span><NotebookPen size={17} /> {recipe.steps.length}ステップ</span>
              </div>
              {recipe.tags.length ? <div className="tag-row detail-tags">{recipe.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div> : null}
            </div>
            <div className="detail-number" aria-hidden="true"><span>NO.</span><strong>#{String(recipe.id).slice(-2).toUpperCase()}</strong></div>
          </header>

          <div className="detail-content-grid">
            <section className="detail-section ingredients-section">
              <div className="detail-section-heading"><span className="section-number">01</span><div><h2>材料</h2></div></div>
              {recipe.ingredients.length ? <ul className="ingredient-list">{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}><span className="check-circle" /> <span>{ingredient}</span></li>)}</ul> : <p className="muted-copy">材料の記録はありません。</p>}
            </section>

            <section className="detail-section steps-section">
              <div className="detail-section-heading"><span className="section-number">02</span><div><h2>作り方</h2></div></div>
              {recipe.steps.length ? <ol className="steps-list">{recipe.steps.map((step, index) => <li key={`${step}-${index}`}><span className="step-list-number">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol> : <p className="muted-copy">作り方の記録はありません。</p>}
            </section>
          </div>

          {(recipe.memo || recipe.source_url) ? (
            <div className="detail-notes-grid">
              {recipe.memo ? <section className="note-card memo-card"><div className="note-card-heading"><NotebookPen size={17} /><span>メモ</span></div><p>{recipe.memo}</p></section> : null}
              {recipe.source_url ? <section className="note-card source-card"><div className="note-card-heading"><ExternalLink size={17} /><span>参考URL</span></div><a href={recipe.source_url} target="_blank" rel="noreferrer">{recipe.source_url}<ExternalLink size={14} /></a></section> : null}
            </div>
          ) : null}

          <footer className="detail-footer"><span>登録者 {user?.displayName || 'メンバー'}</span><span>最終更新 {formatDate(recipe.updated_at)}</span></footer>
        </article>
      ) : null}

      {showDeleteConfirm ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDeleteConfirm(false) }}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="confirm-icon"><Trash2 size={20} /></div>
            <h2 id="delete-title">レシピを削除しますか？</h2>
            <p>「{recipe?.title}」を削除すると、元に戻せません。</p>
            <div className="confirm-actions"><Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button><Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>削除する</Button></div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
