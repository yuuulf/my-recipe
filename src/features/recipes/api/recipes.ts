import {
  localCreateRecipe,
  localDeleteRecipe,
  localGetRecipe,
  localGetRecipes,
  localUpdateRecipe,
} from '../../../lib/localStorage'
import {
  getDemoRecipe,
  getDemoRecipes,
} from '../../../lib/demoData'
import { supabase } from '../../../lib/supabase'
import type { Recipe, RecipeFormValues } from '../../../types/database'

const cleanList = (values: string[]) => values.map((value) => value.trim()).filter(Boolean)

const formToPayload = (
  values: RecipeFormValues,
  groupId: string,
  userId: string,
) => ({
  group_id: groupId,
  title: values.title.trim(),
  description: values.description.trim() || null,
  ingredients: cleanList(values.ingredients),
  steps: cleanList(values.steps),
  tags: cleanList(values.tags),
  cooking_time_minutes: values.cookingTimeMinutes || null,
  servings: values.servings || null,
  source_url: values.sourceUrl.trim() || null,
  memo: values.memo.trim() || null,
  created_by: userId,
})

export const recipeToFormValues = (recipe: Recipe): RecipeFormValues => ({
  title: recipe.title,
  description: recipe.description ?? '',
  ingredients: recipe.ingredients.length ? recipe.ingredients : [''],
  steps: recipe.steps.length ? recipe.steps : [''],
  tags: recipe.tags,
  cookingTimeMinutes: recipe.cooking_time_minutes ?? undefined,
  servings: recipe.servings ?? undefined,
  sourceUrl: recipe.source_url ?? '',
  memo: recipe.memo ?? '',
})

export const getRecipes = async (groupId: string, query = '', isDemoUser = false): Promise<Recipe[]> => {
  if (isDemoUser) return getDemoRecipes(query)
  if (!supabase) return localGetRecipes(groupId, query)

  if (query.trim()) {
    const { data, error } = await supabase.rpc('search_recipes', {
      p_group_id: groupId,
      p_query: query.trim(),
    })
    if (error) throw error
    return (data ?? []) as Recipe[]
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('group_id', groupId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Recipe[]
}

export const getRecipe = async (id: string, isDemoUser = false): Promise<Recipe | null> => {
  if (isDemoUser) return getDemoRecipe(id)
  if (!supabase) return localGetRecipe(id)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Recipe | null) ?? null
}

export const createRecipe = async (
  values: RecipeFormValues,
  groupId: string,
  userId: string,
  isDemoUser = false,
): Promise<Recipe> => {
  if (isDemoUser) throw new Error('デモユーザーはレシピを保存できません。')
  const payload = formToPayload(values, groupId, userId)
  if (!supabase) {
    const createdAt = new Date().toISOString()
    return localCreateRecipe({
      ...payload,
      id: `recipe-${crypto.randomUUID()}`,
      updated_by: userId,
      created_at: createdAt,
      updated_at: createdAt,
    })
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data as Recipe
}

export const updateRecipe = async (
  id: string,
  values: RecipeFormValues,
  userId: string,
  isDemoUser = false,
): Promise<Recipe> => {
  if (isDemoUser) throw new Error('デモユーザーはレシピを変更できません。')
  const payload = formToPayload(values, '', userId)
  const updates = {
    title: payload.title,
    description: payload.description,
    ingredients: payload.ingredients,
    steps: payload.steps,
    tags: payload.tags,
    cooking_time_minutes: payload.cooking_time_minutes,
    servings: payload.servings,
    source_url: payload.source_url,
    memo: payload.memo,
    updated_by: userId,
  }

  if (!supabase) return localUpdateRecipe(id, updates)
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Recipe
}

export const deleteRecipe = async (id: string, isDemoUser = false): Promise<void> => {
  if (isDemoUser) throw new Error('デモユーザーはレシピを削除できません。')
  if (!supabase) {
    localDeleteRecipe(id)
    return
  }
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}
