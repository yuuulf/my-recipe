import { ArrowUpRight, Clock3, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { tagClassName, tagRowClassName } from '../../../components/styles'
import type { Recipe } from '../../../types/database'

const cardClassName = [
  'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface px-4 pt-4 pb-3.75 shadow-sm',
  'transition-[border-color,box-shadow,translate] duration-180 ease-[ease] hover:-translate-y-px hover:border-primary/25 hover:shadow-md',
  'sm:min-h-47.5 sm:px-4.75 sm:pt-4.75 sm:pb-4.25',
].join(' ')

const metaItemClassName = 'inline-flex items-center gap-1.25'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className={cardClassName}>
      <div className="flex min-h-4.5 items-center justify-end">
        <ArrowUpRight className="text-text-muted transition-[color,translate] duration-180 ease-[ease] group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-primary" size={17} aria-hidden="true" />
      </div>
      <h3 className="mt-3.5 mb-2 text-18 leading-[1.4] font-bold tracking-[-.025em] text-text sm:mt-4.5">{recipe.title}</h3>
      {recipe.description ? <p className="line-clamp-2 text-14 leading-[1.55] text-text-secondary sm:min-h-10.5">{recipe.description}</p> : null}
      {recipe.tags.length ? (
        <div className={`${tagRowClassName} order-2 mt-4`}>
          {recipe.tags.slice(0, 4).map((tag) => <span className={tagClassName} key={tag}>#{tag}</span>)}
        </div>
      ) : null}
      <div className="order-3 mt-auto flex flex-wrap gap-3.5 pt-3.25 text-13 text-text-secondary sm:pt-3.75">
        {recipe.cooking_time_minutes ? (
          <span className={metaItemClassName}><Clock3 className="text-primary" size={15} /> {recipe.cooking_time_minutes}分</span>
        ) : null}
        {recipe.servings ? (
          <span className={metaItemClassName}><UsersRound className="text-primary" size={15} /> {recipe.servings}人分</span>
        ) : null}
      </div>
    </Link>
  )
}
