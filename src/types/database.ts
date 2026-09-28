export type Role = 'owner' | 'member'

export type AppUser = {
  id: string
  email: string
  displayName?: string | null
}

export type Profile = {
  id: string
  display_name: string | null
  created_at: string
}

export type Group = {
  id: string
  name: string
  invite_token: string
  created_by: string
  created_at: string
}

export type GroupMember = {
  group_id: string
  user_id: string
  role: Role
  created_at: string
  profile?: Pick<Profile, 'display_name'> | null
}

export type Recipe = {
  id: string
  group_id: string
  title: string
  description: string | null
  ingredients: string[]
  steps: string[]
  tags: string[]
  cooking_time_minutes: number | null
  servings: number | null
  source_url: string | null
  memo: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type RecipeFormValues = {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  cookingTimeMinutes?: number
  servings?: number
  sourceUrl: string
  memo: string
}

export type RecipeInsert = Omit<
  Recipe,
  'id' | 'created_at' | 'updated_at' | 'updated_by'
> & {
  updated_by?: string | null
}

export type RecipeUpdate = Partial<
  Pick<
    Recipe,
    | 'title'
    | 'description'
    | 'ingredients'
    | 'steps'
    | 'tags'
    | 'cooking_time_minutes'
    | 'servings'
    | 'source_url'
    | 'memo'
  >
> & {
  updated_by: string
}
