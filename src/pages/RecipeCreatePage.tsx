import { AppShell } from '../components/Layout/AppShell'
import { useApp } from '../contexts/app-context'
import { createRecipe } from '../features/recipes/api/recipes'
import { RecipeForm } from '../features/recipes/components/RecipeForm'
import { useNavigate } from 'react-router-dom'

export function RecipeCreatePage() {
  const { group, user } = useApp()
  const navigate = useNavigate()

  return (
    <AppShell>
      <RecipeForm
        submitLabel="レシピを保存"
        onSubmit={async (values) => {
          if (!group || !user) throw new Error('レシピ帳が見つかりません。')
          const recipe = await createRecipe(values, group.id, user.id)
          navigate(`/recipes/${recipe.id}`)
        }}
      />
    </AppShell>
  )
}
