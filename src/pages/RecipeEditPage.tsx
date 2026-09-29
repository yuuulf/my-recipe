import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/Layout/AppShell'
import { PageLoader } from '../components/Loading'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getRecipe, recipeToFormValues, updateRecipe } from '../features/recipes/api/recipes'
import { RecipeForm } from '../features/recipes/components/RecipeForm'
import type { RecipeFormValues } from '../types/database'

export function RecipeEditPage() {
  const { id } = useParams<{ id: string }>()
  const { group, user, isDemoUser } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = useState<RecipeFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    void getRecipe(id, isDemoUser)
      .then((recipe) => {
        if (!active) return
        if (!recipe || (group && recipe.group_id !== group.id)) {
          setError('レシピが見つかりません。')
          return
        }
        setValues(recipeToFormValues(recipe))
      })
      .catch((loadError: unknown) => { if (active) setError(getErrorMessage(loadError, 'レシピを読み込めませんでした。')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [group, id, isDemoUser])

  return (
    <AppShell>
      {loading ? <PageLoader label="レシピを読み込んでいます…" /> : null}
      {!loading && error ? <div className="alert error" role="alert">{error}</div> : null}
      {!loading && values && id ? (
        <RecipeForm
          defaultValues={values}
          submitLabel="変更を保存"
          disableSave={isDemoUser}
          onSubmit={async (nextValues) => {
            if (isDemoUser) throw new Error('デモユーザーはレシピを変更できません。')
            if (!user) throw new Error('ログインが必要です。')
            await updateRecipe(id, nextValues, user.id, isDemoUser)
            navigate(`/recipes/${id}`)
          }}
        />
      ) : null}
    </AppShell>
  )
}
