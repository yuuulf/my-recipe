import { Plus, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { buttonClassName } from '../components/buttonStyles'
import { EmptyState } from '../components/EmptyState'
import { PageLoader } from '../components/Loading'
import { AppShell } from '../components/Layout/AppShell'
import { alertErrorClassName, eyebrowClassName, pageHeaderClassName, pageLeadClassName, pageTitleClassName } from '../components/styles'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getRecipes } from '../features/recipes/api/recipes'
import { RecipeCard } from '../features/recipes/components/RecipeCard'
import { RecipeSearch } from '../features/recipes/components/RecipeSearch'
import type { Recipe } from '../types/database'

const tagFilters = ['すべて', '肉', '魚', '野菜', '麺', '簡単']

const filterChipClassName = (selected: boolean) => [
  'min-h-8.5 flex-none rounded-md border px-3.25 text-13 transition-[color,background,border-color] duration-180 ease-[ease]',
  selected
    ? 'border-primary bg-primary font-bold text-white'
    : 'border-border bg-surface text-text-secondary hover:border-border-hover hover:text-primary',
].join(' ')

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
      <div className={`${pageHeaderClassName} mb-6.75 md:mb-7.5`}>
        <div>
          <span className={eyebrowClassName}>{group?.name ?? 'レシピ帳'}</span>
          <h1 className={pageTitleClassName}>レシピ一覧</h1>
          <p className={pageLeadClassName}>いつものごはんを、もっとおいしく、もっと楽しく。</p>
        </div>
        <Link to="/recipes/new" className={buttonClassName('primary', 'w-full whitespace-nowrap sm:w-auto')}><Plus size={18} /> レシピを追加</Link>
      </div>

      <div className="mb-6.75 sm:mb-7.75">
        <RecipeSearch value={query} onChange={setQuery} onClear={() => setQuery('')} />
        <div className="mt-3.5 flex gap-2 overflow-x-auto pt-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="タグで絞り込む">
          {visibleTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={filterChipClassName(selectedTag === tag)}
              onClick={() => setSelectedTag(tag)}
            >
              {tag === 'すべて' ? 'すべて' : tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3.75 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-baseline gap-2.25">
          <h2 className="text-20 font-bold tracking-[-.025em] text-text">{recentLabel}</h2>
          {!loading ? <span className="text-13 text-text-muted">{filteredRecipes.length}件</span> : null}
        </div>
      </div>

      {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
      {loading ? (
        <PageLoader label="レシピを読み込んでいます…" />
      ) : filteredRecipes.length ? (
        <div className="grid grid-cols-1 gap-2.75 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {filteredRecipes.map((recipe) => <RecipeCard recipe={recipe} key={recipe.id} />)}
        </div>
      ) : (
        <EmptyState
          icon={<UtensilsCrossed size={25} />}
          title={query || selectedTag !== 'すべて' ? '見つかりませんでした' : 'まだレシピがありません'}
          description={query || selectedTag !== 'すべて' ? '検索条件を変えて、もう一度お試しください。' : '最初のレシピを登録して、あなたのレシピ帳を始めましょう。'}
        >
          {query || selectedTag !== 'すべて' ? (
            <Button variant="secondary" onClick={() => { setQuery(''); setSelectedTag('すべて') }}>絞り込みをリセット</Button>
          ) : (
            <Link to="/recipes/new" className={buttonClassName()}><Plus size={17} /> レシピを追加</Link>
          )}
        </EmptyState>
      )}
    </AppShell>
  )
}
