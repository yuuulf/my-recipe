import { ChevronRight, Clock3, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { tagClassName, tagRowClassName } from '../../../components/styles'
import type { Recipe } from '../../../types/database'

const cardClassName = [
  'group flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-4 py-3.5 shadow-sm',
  'transition-[border-color,box-shadow] duration-180 ease-[ease] hover:border-primary/25 hover:shadow-md',
  'sm:px-4.75 sm:py-4',
].join(' ')

const metaItemClassName = 'inline-flex items-center gap-1.25'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const hasMeta = Boolean(recipe.cooking_time_minutes || recipe.servings)

  return (
    <Link to={`/recipes/${recipe.id}`} className={cardClassName}>
      <div className="flex items-start gap-3">
        <h3 className="min-w-0 flex-1 text-16 leading-[1.45] font-bold tracking-[-.02em] text-text sm:text-18">{recipe.title}</h3>
        <ChevronRight className="mt-0.5 flex-none text-text-muted transition-colors duration-180 ease-[ease] group-hover:text-primary" size={18} aria-hidden="true" />
      </div>
      {recipe.description ? <p className="line-clamp-1 text-14 leading-[1.55] text-text-secondary">{recipe.description}</p> : null}
      {recipe.tags.length || hasMeta ? (
        <div className="mt-auto flex items-end gap-3 pt-1">
          <div className={`${tagRowClassName} min-w-0 flex-1`}>
            {recipe.tags.slice(0, 4).map((tag) => <span className={tagClassName} key={tag}>#{tag}</span>)}
          </div>
          {hasMeta ? (
            <div className="flex flex-none gap-3 text-13 text-text-secondary">
              {recipe.cooking_time_minutes ? (
                <span className={metaItemClassName}><Clock3 className="text-primary" size={15} /> {recipe.cooking_time_minutes}分</span>
              ) : null}
              {recipe.servings ? (
                <span className={metaItemClassName}><UsersRound className="text-primary" size={15} /> {recipe.servings}人分</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Link>
  )
}
