import type {
  AppUser,
  Group,
  GroupMember,
  Profile,
  Recipe,
} from '../types/database'

const STORAGE_KEY = 'my-recipe-local-state'
const LOCAL_USER_ID = 'local-demo-user'
const LOCAL_GROUP_ID = 'local-demo-group'

type LocalState = {
  user: AppUser | null
  currentGroupId?: string | null
  profiles: Profile[]
  groups: Group[]
  members: GroupMember[]
  recipes: Recipe[]
}

const now = () => new Date().toISOString()

const createInitialState = (): LocalState => {
  const createdAt = now()
  const user: AppUser = {
    id: LOCAL_USER_ID,
    email: 'demo@example.com',
    displayName: 'デモユーザー',
  }
  const group: Group = {
    id: LOCAL_GROUP_ID,
    name: '我が家のレシピ',
    invite_token: 'demo-invite-token',
    created_by: LOCAL_USER_ID,
    created_at: createdAt,
  }

  return {
    user,
    currentGroupId: group.id,
    profiles: [
      {
        id: LOCAL_USER_ID,
        display_name: user.displayName ?? 'デモユーザー',
        created_at: createdAt,
      },
    ],
    groups: [group],
    members: [
      {
        group_id: group.id,
        user_id: LOCAL_USER_ID,
        role: 'owner',
        created_at: createdAt,
        profile: { display_name: user.displayName ?? null },
      },
    ],
    recipes: [
      {
        id: 'recipe-ginger-pork',
        group_id: group.id,
        title: '豚の生姜焼き',
        description: '甘辛いタレでご飯がすすむ、定番の家庭料理。',
        ingredients: [
          '豚ロース薄切り 300g',
          '玉ねぎ 1/2個',
          '醤油 大さじ2',
          'みりん 大さじ2',
          'すりおろししょうが 小さじ1',
        ],
        steps: [
          '玉ねぎを薄切りにし、調味料を混ぜ合わせる。',
          'フライパンに油を熱し、豚肉を両面焼く。',
          '玉ねぎを加えてしんなりするまで炒める。',
          '合わせた調味料を加え、照りが出るまで煮からめる。',
        ],
        tags: ['肉', '簡単', '夕食'],
        cooking_time_minutes: 20,
        servings: 2,
        source_url: null,
        memo: '少し砂糖を追加してもおいしい。',
        created_by: LOCAL_USER_ID,
        updated_by: LOCAL_USER_ID,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 'recipe-oyakodon',
        group_id: group.id,
        title: 'ふわとろ親子丼',
        description: 'だしの香りと卵のやさしい味わい。',
        ingredients: [
          '鶏もも肉 200g',
          '玉ねぎ 1/2個',
          '卵 2個',
          'だし汁 100ml',
          '醤油 大さじ1',
        ],
        steps: [
          '鶏肉をひと口大、玉ねぎを薄切りにする。',
          '小鍋でだし汁と調味料、玉ねぎを煮る。',
          '鶏肉を加えて火を通し、溶き卵を回し入れる。',
          '半熟で火を止め、ご飯にのせる。',
        ],
        tags: ['鶏肉', '丼', '15分'],
        cooking_time_minutes: 15,
        servings: 2,
        source_url: null,
        memo: null,
        created_by: LOCAL_USER_ID,
        updated_by: LOCAL_USER_ID,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 'recipe-tomato-pasta',
        group_id: group.id,
        title: 'トマトとツナのパスタ',
        description: '忙しい日に作りたい、フライパンひとつのパスタ。',
        ingredients: [
          'スパゲッティ 200g',
          'カットトマト缶 1缶',
          'ツナ缶 1缶',
          'にんにく 1片',
        ],
        steps: [
          'にんにくをオリーブオイルで炒める。',
          'トマト缶とツナを加えて煮込む。',
          '茹でたパスタを加えて和える。',
        ],
        tags: ['麺', '簡単', '平日'],
        cooking_time_minutes: 25,
        servings: 2,
        source_url: null,
        memo: '仕上げに粉チーズをたっぷり。',
        created_by: LOCAL_USER_ID,
        updated_by: LOCAL_USER_ID,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ],
  }
}

export const readLocalState = (): LocalState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalState
      if (!('currentGroupId' in parsed)) {
        parsed.currentGroupId = parsed.members[0]?.group_id ?? null
      }
      return parsed
    }
  } catch {
    // Storage can be unavailable in privacy mode. The in-memory fallback below
    // still lets the app be previewed.
  }

  const initial = createInitialState()
  writeLocalState(initial)
  return initial
}

export const writeLocalState = (state: LocalState) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors and keep the current in-memory state for this tab.
  }
}

export const getLocalUser = () => readLocalState().user

export const localSignIn = (email: string): AppUser => {
  const state = readLocalState()
  const user: AppUser = {
    id: LOCAL_USER_ID,
    email,
    displayName: state.user?.displayName ?? email.split('@')[0] ?? 'ユーザー',
  }
  state.user = user
  const profile = state.profiles.find((item) => item.id === user.id)
  if (profile) profile.display_name = user.displayName ?? null
  writeLocalState(state)
  return user
}

export const localSignOut = () => {
  const state = readLocalState()
  state.user = null
  writeLocalState(state)
}

export const localGetCurrentGroup = (userId: string): Group | null => {
  const state = readLocalState()
  const membership = state.members.find(
    (item) => item.user_id === userId && item.group_id === state.currentGroupId,
  ) ?? state.members.find((item) => item.user_id === userId)
  return state.groups.find((item) => item.id === membership?.group_id) ?? null
}

export const localGetMembers = (groupId: string): GroupMember[] =>
  readLocalState().members
    .filter((item) => item.group_id === groupId)
    .map((item) => ({ ...item }))

export const localCreateGroup = (name: string, userId: string): Group => {
  const state = readLocalState()
  const group: Group = {
    id: `group-${crypto.randomUUID()}`,
    name,
    invite_token: crypto.randomUUID(),
    created_by: userId,
    created_at: now(),
  }
  state.groups.push(group)
  state.currentGroupId = group.id
  state.members.push({
    group_id: group.id,
    user_id: userId,
    role: 'owner',
    created_at: group.created_at,
    profile: {
      display_name:
        state.profiles.find((item) => item.id === userId)?.display_name ?? null,
    },
  })
  writeLocalState(state)
  return group
}

export const localJoinGroup = (inviteToken: string, userId: string): Group => {
  const state = readLocalState()
  const group = state.groups.find((item) => item.invite_token === inviteToken)
  if (!group) throw new Error('招待リンクが見つかりません。')

  if (!state.members.some((item) => item.group_id === group.id && item.user_id === userId)) {
    state.members.push({
      group_id: group.id,
      user_id: userId,
      role: 'member',
      created_at: now(),
      profile: {
        display_name:
          state.profiles.find((item) => item.id === userId)?.display_name ?? null,
      },
    })
    writeLocalState(state)
  }
  state.currentGroupId = group.id
  writeLocalState(state)
  return group
}

export const localGetGroupByInviteToken = (inviteToken: string): Group | null =>
  readLocalState().groups.find((item) => item.invite_token === inviteToken) ?? null

export const localGetRecipes = (groupId: string, query = ''): Recipe[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')
  return readLocalState()
    .recipes.filter((recipe) => {
      if (recipe.group_id !== groupId) return false
      if (!normalizedQuery) return true
      return [
        recipe.title,
        recipe.description ?? '',
        recipe.memo ?? '',
        ...recipe.ingredients,
        ...recipe.tags,
      ].some((value) => value.toLocaleLowerCase('ja-JP').includes(normalizedQuery))
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export const localGetRecipe = (id: string): Recipe | null =>
  readLocalState().recipes.find((recipe) => recipe.id === id) ?? null

export const localCreateRecipe = (recipe: Recipe): Recipe => {
  const state = readLocalState()
  state.recipes.push(recipe)
  writeLocalState(state)
  return recipe
}

export const localUpdateRecipe = (id: string, updates: Partial<Recipe>): Recipe => {
  const state = readLocalState()
  const index = state.recipes.findIndex((recipe) => recipe.id === id)
  if (index < 0) throw new Error('レシピが見つかりません。')
  const updated = { ...state.recipes[index], ...updates, updated_at: now() }
  state.recipes[index] = updated
  writeLocalState(state)
  return updated
}

export const localDeleteRecipe = (id: string) => {
  const state = readLocalState()
  state.recipes = state.recipes.filter((recipe) => recipe.id !== id)
  writeLocalState(state)
}

export const localGetProfileName = (userId: string) =>
  readLocalState().profiles.find((profile) => profile.id === userId)?.display_name ?? null
