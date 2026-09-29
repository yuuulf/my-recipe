import type { AppUser, Group, GroupMember, Recipe } from '../types/database'

export const DEMO_USER_ID = 'portfolio-demo-user'
export const DEMO_GROUP_ID = 'portfolio-demo-group'
export const DEMO_INVITE_TOKEN = 'portfolio-demo-invite'

const DEMO_SESSION_KEY = 'my-recipe-demo-session'
const DEMO_QUERY_KEY = 'demo'

export const DEMO_USER: AppUser = {
  id: DEMO_USER_ID,
  email: 'demonstration@example.com',
  displayName: 'デモユーザー',
}

export const DEMO_GROUP: Group = {
  id: DEMO_GROUP_ID,
  name: 'みんなのレシピ帳',
  invite_token: DEMO_INVITE_TOKEN,
  created_by: DEMO_USER_ID,
  created_at: '2025-01-12T09:00:00.000Z',
}

const DEMO_MEMBERS: readonly GroupMember[] = [
  {
    group_id: DEMO_GROUP_ID,
    user_id: DEMO_USER_ID,
    role: 'owner',
    created_at: '2025-01-12T09:00:00.000Z',
    profile: { display_name: 'デモユーザー' },
  },
  {
    group_id: DEMO_GROUP_ID,
    user_id: 'portfolio-demo-member-yuki',
    role: 'member',
    created_at: '2025-01-13T09:30:00.000Z',
    profile: { display_name: 'ゆき' },
  },
  {
    group_id: DEMO_GROUP_ID,
    user_id: 'portfolio-demo-member-kenta',
    role: 'member',
    created_at: '2025-01-14T18:00:00.000Z',
    profile: { display_name: 'けんた' },
  },
]

const DEMO_RECIPES: readonly Recipe[] = [
  {
    id: 'portfolio-recipe-ginger-pork',
    group_id: DEMO_GROUP_ID,
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
    created_by: DEMO_USER_ID,
    updated_by: DEMO_USER_ID,
    created_at: '2025-02-02T10:00:00.000Z',
    updated_at: '2025-02-02T10:00:00.000Z',
  },
  {
    id: 'portfolio-recipe-oyakodon',
    group_id: DEMO_GROUP_ID,
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
    created_by: DEMO_USER_ID,
    updated_by: DEMO_USER_ID,
    created_at: '2025-02-05T08:30:00.000Z',
    updated_at: '2025-02-05T08:30:00.000Z',
  },
  {
    id: 'portfolio-recipe-tomato-pasta',
    group_id: DEMO_GROUP_ID,
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
    created_by: DEMO_USER_ID,
    updated_by: DEMO_USER_ID,
    created_at: '2025-02-08T12:00:00.000Z',
    updated_at: '2025-02-08T12:00:00.000Z',
  },
]

const cloneRecipe = (recipe: Recipe): Recipe => ({
  ...recipe,
  ingredients: [...recipe.ingredients],
  steps: [...recipe.steps],
  tags: [...recipe.tags],
})

export const getDemoUser = (): AppUser => ({ ...DEMO_USER })

export const getDemoGroup = (): Group => ({ ...DEMO_GROUP })

export const getDemoMembers = (): GroupMember[] =>
  DEMO_MEMBERS.map((member) => ({
    ...member,
    profile: member.profile ? { ...member.profile } : null,
  }))

export const getDemoRecipes = (query = ''): Recipe[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')
  return DEMO_RECIPES
    .filter((recipe) => {
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
    .map(cloneRecipe)
}

export const getDemoRecipe = (id: string): Recipe | null => {
  const recipe = DEMO_RECIPES.find((item) => item.id === id)
  return recipe ? cloneRecipe(recipe) : null
}

const getSessionStorage = () => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const isDemoSessionActive = () => {
  try {
    const queryValue = new URLSearchParams(window.location.search).get(DEMO_QUERY_KEY)
    if (queryValue === '1') return true
  } catch {
    // The session storage check below still supports normal browser usage.
  }
  return getSessionStorage()?.getItem(DEMO_SESSION_KEY) === 'true'
}

export const startDemoSession = () => {
  try {
    getSessionStorage()?.setItem(DEMO_SESSION_KEY, 'true')
  } catch {
    // A storage-restricted browser can still use the in-memory demo state.
  }
}

export const clearDemoSession = () => {
  try {
    getSessionStorage()?.removeItem(DEMO_SESSION_KEY)
  } catch {
    // Ignore storage errors while leaving the current session state intact.
  }
}
