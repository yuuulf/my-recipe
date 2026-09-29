import { Plus, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { AppShell } from '../components/Layout/AppShell'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getRecipes } from '../features/recipes/api/recipes'
import { RecipeCard } from '../features/recipes/components/RecipeCard'
import { RecipeSearch } from '../features/recipes/components/RecipeSearch'
import type { Recipe } from '../types/database'

const tagFilters = ['すべて', '肉', '魚', '野菜', '麺', '簡単']

export function RecipeListPage() {
  const { group, isDemoUser } = useApp()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('すべて')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!group) return
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void getRecipes(group.id, query, isDemoUser)
        .then((data) => {
          if (active) setRecipes(data)
        })
        .catch((loadError: unknown) => {
          if (active) setError(getErrorMessage(loadError, 'レシピを読み込めませんでした。'))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, query ? 220 : 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [group, isDemoUser, query])

  const filteredRecipes = useMemo(() => {
    if (selectedTag === 'すべて') return recipes
    return recipes.filter((recipe) => recipe.tags.includes(selectedTag))
  }, [recipes, selectedTag])

  const visibleTags = useMemo(() => {
    const discovered = recipes.flatMap((recipe) => recipe.tags)
    return Array.from(new Set([...tagFilters, ...discovered])).slice(0, 10)
  }, [recipes])

  const recentLabel = query || selectedTag !== 'すべて' ? '検索結果' : 'すべてのレシピ'

  return (
    <AppShell>
      <div className="page-header recipe-list-header">
        <div>
          <span className="eyebrow">{group?.name ?? 'レシピ帳'}</span>
          <h1>レシピ一覧</h1>
          <p>いつものごはんを、もっとおいしく、もっと楽しく。</p>
        </div>
        <Link to="/recipes/new" className="button button-primary header-add-button"><Plus size={18} /> レシピを追加</Link>
      </div>

      <div className="list-toolbar">
        <RecipeSearch value={query} onChange={setQuery} onClear={() => setQuery('')} />
        <div className="filter-row" aria-label="タグで絞り込む">
          {visibleTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`filter-chip ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag === 'すべて' ? 'すべて' : tag}
            </button>
          ))}
        </div>
      </div>

      <div className="list-section-heading">
        <div>
          <h2>{recentLabel}</h2>
          {!loading ? <span>{filteredRecipes.length}件</span> : null}
        </div>
      </div>

      {error ? <div className="alert error" role="alert">{error}</div> : null}
      {loading ? (
        <PageLoader label="レシピを読み込んでいます…" />
      ) : filteredRecipes.length ? (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) => <RecipeCard recipe={recipe} key={recipe.id} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><UtensilsCrossed size={25} /></div>
          <h2>{query || selectedTag !== 'すべて' ? '見つかりませんでした' : 'まだレシピがありません'}</h2>
          <p>{query || selectedTag !== 'すべて' ? '検索条件を変えて、もう一度お試しください。' : '最初のレシピを登録して、あなたのレシピ帳を始めましょう。'}</p>
          {query || selectedTag !== 'すべて' ? (
            <Button variant="secondary" onClick={() => { setQuery(''); setSelectedTag('すべて') }}>絞り込みをリセット</Button>
          ) : (
            <Link to="/recipes/new" className="button button-primary"><Plus size={17} /> レシピを追加</Link>
          )}
        </div>
      )}
    </AppShell>
  )
}
