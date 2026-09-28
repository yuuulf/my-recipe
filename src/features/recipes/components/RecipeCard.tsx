import { ArrowUpRight, Clock3, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../../../types/database'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-topline">
        <span className="recipe-card-kicker">RECIPE</span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </div>
      <h3>{recipe.title}</h3>
      {recipe.description ? <p>{recipe.description}</p> : null}
      <div className="recipe-card-meta">
        {recipe.cooking_time_minutes ? (
          <span><Clock3 size={15} /> {recipe.cooking_time_minutes}分</span>
        ) : null}
        {recipe.servings ? (
          <span><UsersRound size={15} /> {recipe.servings}人分</span>
        ) : null}
      </div>
      {recipe.tags.length ? (
        <div className="tag-row">
          {recipe.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
        </div>
      ) : null}
    </Link>
  )
}
