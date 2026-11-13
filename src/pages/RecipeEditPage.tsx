import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/Layout/AppShell'
import { PageLoader } from '../components/Loading'
import { alertErrorClassName } from '../components/styles'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getRecipe, recipeToFormValues, updateRecipe } from '../features/recipes/api/recipes'
import { RecipeForm } from '../features/recipes/components/RecipeForm'
import type { RecipeFormValues } from '../types/database'

export function RecipeEditPage() {
  const { id } = useParams<{ id: string }>()
  const { group, groups, selectGroup, user, isDemoUser } = useApp()
  const navigate = useNavigate()
  const [values, setValues] = useState<RecipeFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // The recipe whose values are in the form. Switching the open recipe note or
  // other context updates must not reload it and replace what the user typed.
  const loadedRecipeIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!id || loadedRecipeIdRef.current === id) return
    let active = true
    void getRecipe(id, isDemoUser)
      .then((recipe) => {
        if (!active) return
        // A recipe of another recipe note the user belongs to: open that note and edit it.
        const inOtherNote = Boolean(recipe && group && recipe.group_id !== group.id)
        if (!recipe || (inOtherNote && !groups.some((item) => item.id === recipe.group_id))) {
          setError('レシピが見つかりません。')
          return
        }
        loadedRecipeIdRef.current = id
        setValues(recipeToFormValues(recipe))
        // Switching the note re-runs this effect, which then stops early, so
        // finish loading here rather than relying on this run staying active.
        setLoading(false)
        if (inOtherNote) void selectGroup(recipe.group_id)
      })
      .catch((loadError: unknown) => { if (active) setError(getErrorMessage(loadError, 'レシピを読み込めませんでした。')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [group, groups, id, isDemoUser, selectGroup])

  return (
    <AppShell>
      {loading ? <PageLoader label="レシピを読み込んでいます…" /> : null}
      {!loading && error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
      {!loading && values && id ? (
        <RecipeForm
          title="レシピを編集"
          defaultValues={values}
          submitLabel="変更を保存"
          disableSave={isDemoUser}
          onSubmit={async (nextValues) => {
            if (isDemoUser) throw new Error('デモモードではレシピを変更できません。')
            if (!user) throw new Error('ログインが必要です。')
            await updateRecipe(id, nextValues, user.id, isDemoUser)
            navigate(`/recipes/${id}`)
          }}
        />
      ) : null}
    </AppShell>
  )
}
