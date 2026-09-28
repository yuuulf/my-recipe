# 料理レシピ管理Webアプリ 実装プラン

## 1. 概要

料理レシピを簡単に登録・検索・閲覧し、家族や知人など複数人で共有できるWebアプリを開発する。

日常的に使うことを前提として、以下を特に重視する。

- レシピを簡単に登録できる
- 料理名・材料などからすぐに検索できる
- スマートフォンから見やすい
- 複数人で同じレシピ帳を共有できる
- 一度ログインすれば、基本的に再ログインを求めない
- 機能を増やしすぎず、シンプルに使える

---

# 2. 技術構成

## フロントエンド

- React
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Tailwind CSS

## バックエンド / インフラ

- Supabase

MVPで利用するSupabaseの機能：

- PostgreSQL
- Supabase Auth
- Row Level Security（RLS）
- RPC

## デプロイ

- Vercel

## 基本構成

```text
React + TypeScript
        │
        ▼
Supabase
├── PostgreSQL
│   ├── profiles
│   ├── groups
│   ├── group_members
│   └── recipes
│
├── Auth
│
└── RLS
```

MVPではFastAPIなどの独自バックエンドは使用せず、ReactからSupabaseを直接利用する。

---

# 3. MVPの機能

## 必須機能

- ログイン
- ログイン状態の維持
- レシピ一覧
- レシピ詳細
- レシピ登録
- レシピ編集
- レシピ削除
- キーワード検索
- タグ
- 調理時間
- 人数
- 参考URL
- メモ
- グループ作成
- 複数ユーザーでの共有
- 招待リンク
- グループ参加

---

# 4. MVPでは実装しない機能

以下は初期リリース後に検討する。

- 料理画像
- お気に入り
- 作った履歴
- 人気ランキング
- コメント
- 買い物リスト
- AIによるレシピ生成
- レシピURLからの自動取り込み
- 画像OCR
- 献立作成
- カレンダー
- 栄養計算
- プッシュ通知

---

# 5. 画面構成

```text
/login
/setup
/recipes
/recipes/new
/recipes/:id
/recipes/:id/edit
/join/:token
/settings
```

| URL | 画面 | 内容 |
|---|---|---|
| `/login` | ログイン | 初回ログイン |
| `/setup` | 初期設定 | グループ作成 |
| `/recipes` | レシピ一覧 | 検索・閲覧 |
| `/recipes/new` | レシピ登録 | 新規レシピ作成 |
| `/recipes/:id` | レシピ詳細 | レシピ閲覧 |
| `/recipes/:id/edit` | レシピ編集 | レシピ編集 |
| `/join/:token` | グループ参加 | 招待リンクから参加 |
| `/settings` | 設定 | グループ・メンバー管理 |

---

# 6. ログインフロー

初回アクセス時：

```text
/login
   │
   ▼
ログイン
   │
   ▼
グループ参加済み？
   │
   ├── NO → /setup
   │
   └── YES
         │
         ▼
      /recipes
```

2回目以降はログイン状態を維持する。

```text
アクセス
   │
   ▼
Supabase Session確認
   │
   ├── Sessionあり → /recipes
   │
   └── Sessionなし → /login
```

---

# 7. 認証

## 認証方式

基本的にはSupabase Authを利用する。

候補：

- Magic Link
- Googleログイン

MVPではMagic Linkを第一候補とする。

```text
メールアドレス入力
        │
        ▼
ログインメール送信
        │
        ▼
メール内リンクをクリック
        │
        ▼
ログイン完了
```

パスワード管理を不要にする。

---

# 8. Supabaseクライアント

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
```

`.env`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

---

# 9. レシピ一覧画面

URL：

```text
/recipes
```

アプリで最も頻繁に使用する画面。

## UIイメージ

```text
┌──────────────────────────┐
│ 🍳 みんなのレシピ    ⚙️ │
│                          │
│ 🔍 料理名・材料から検索  │
│                          │
│ [すべて] [肉] [魚] [麺] │
│                          │
│ 最近更新                 │
│                          │
│ ┌──────────────────────┐ │
│ │ 豚の生姜焼き         │ │
│ │ ⏱20分 👤2人分       │ │
│ │ #肉 #簡単            │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 親子丼               │ │
│ │ ⏱15分 👤2人分       │ │
│ │ #鶏肉 #丼            │ │
│ └──────────────────────┘ │
│                          │
│              ＋ 登録     │
└──────────────────────────┘
```

## 機能

- レシピ一覧取得
- キーワード検索
- タグ絞り込み
- レシピ詳細への遷移
- 新規登録画面への遷移
- 更新日の新しい順に表示

---

# 10. レシピ登録画面

URL：

```text
/recipes/new
```

## 方針

登録のハードルをできるだけ低くする。

**必須項目は料理名のみ。**

その他はすべて任意入力とする。

## 入力項目

### 必須

- 料理名

### 任意

- 説明
- 材料
- 作り方
- タグ
- 調理時間
- 人数
- 参考URL
- メモ

---

# 11. 材料入力

材料はDBを過剰に正規化せず、1材料を1つの文字列として扱う。

### 採用

```text
豚ロース 300g
玉ねぎ 1/2個
醤油 大さじ2
```

### 採用しない

```text
材料名：豚ロース
数量：300
単位：g
```

入力の簡単さを優先する。

---

# 12. レシピ詳細画面

URL：

```text
/recipes/:id
```

## 表示内容

```text
豚の生姜焼き

⏱ 20分
👤 2人分

#肉
#簡単
#夕食

----------------

材料

・豚ロース 300g
・玉ねぎ 1/2個
・醤油 大さじ2

----------------

作り方

1. 玉ねぎを薄切りにする

2. 豚肉を焼く

3. 玉ねぎを追加する

4. 調味料を追加する

----------------

メモ

少し砂糖を追加しても美味しい

----------------

参考URL

https://example.com

----------------

登録者
更新日時
```

料理中にスマートフォンで見ることを想定し、文字を大きめにする。

---

# 13. レシピ編集画面

URL：

```text
/recipes/:id/edit
```

登録画面と同じ `RecipeForm` コンポーネントを使用する。

新規：

```tsx
<RecipeForm
  onSubmit={createRecipe}
/>
```

編集：

```tsx
<RecipeForm
  defaultValues={recipe}
  onSubmit={updateRecipe}
/>
```

登録画面と編集画面でフォームを重複実装しない。

---

# 14. グループ設定画面

URL：

```text
/settings
```

## 表示内容

```text
グループ設定

我が家のレシピ

----------------

メンバー

ユーザーA   owner
ユーザーB   member
ユーザーC   member

----------------

メンバーを招待

https://example.com/join/xxxxxxxx

[リンクをコピー]

----------------

ログアウト
```

---

# 15. 招待画面

URL：

```text
/join/:token
```

## ログイン済み

```text
「我が家のレシピ」に
参加しますか？

[参加する]
```

## 未ログイン

```text
招待URL
   │
   ▼
ログイン
   │
   ▼
グループ参加
   │
   ▼
/recipes
```

---

# 16. DB構成

```text
auth.users
   │
   ├──────── profiles
   │
   └──────── group_members
                    │
                    ▼
                  groups
                    │
                    ▼
                  recipes
```

使用するテーブル：

```text
profiles
groups
group_members
recipes
```

---

# 17. profilesテーブル

ユーザー表示情報を保存する。

```sql
create table public.profiles (
  id uuid
    primary key
    references auth.users(id)
    on delete cascade,

  display_name text,

  created_at timestamptz
    not null
    default now()
);
```

---

# 18. groupsテーブル

複数ユーザーで共有する「レシピ帳」。

```sql
create table public.groups (
  id uuid
    primary key
    default gen_random_uuid(),

  name text
    not null,

  invite_token uuid
    not null
    unique
    default gen_random_uuid(),

  created_by uuid
    not null
    references auth.users(id),

  created_at timestamptz
    not null
    default now()
);
```

例：

```text
name:
我が家のレシピ
```

---

# 19. group_membersテーブル

ユーザーとグループの関係を管理する。

```sql
create table public.group_members (
  group_id uuid
    not null
    references public.groups(id)
    on delete cascade,

  user_id uuid
    not null
    references auth.users(id)
    on delete cascade,

  role text
    not null
    default 'member'
    check (role in ('owner', 'member')),

  created_at timestamptz
    not null
    default now(),

  primary key (group_id, user_id)
);
```

関係：

```text
我が家のレシピ

├── User A
│   └── owner
│
├── User B
│   └── member
│
└── User C
    └── member
```

---

# 20. recipesテーブル

```sql
create table public.recipes (
  id uuid
    primary key
    default gen_random_uuid(),

  group_id uuid
    not null
    references public.groups(id)
    on delete cascade,

  title text
    not null,

  description text,

  ingredients text[]
    not null
    default '{}',

  steps text[]
    not null
    default '{}',

  tags text[]
    not null
    default '{}',

  cooking_time_minutes integer,

  servings integer,

  source_url text,

  memo text,

  created_by uuid
    not null
    references auth.users(id),

  updated_by uuid
    references auth.users(id),

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);
```

---

# 21. Recipeデータ例

```json
{
  "title": "豚の生姜焼き",

  "ingredients": [
    "豚ロース 300g",
    "玉ねぎ 1/2個",
    "醤油 大さじ2",
    "みりん 大さじ2",
    "しょうが 適量"
  ],

  "steps": [
    "玉ねぎを薄切りにする",
    "豚肉を焼く",
    "玉ねぎを追加する",
    "調味料を追加する"
  ],

  "tags": [
    "肉",
    "簡単",
    "夕食"
  ],

  "cooking_time_minutes": 20,

  "servings": 2
}
```

---

# 22. TypeScript型

## Recipe

```ts
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
```

---

# 23. RecipeFormValues

```ts
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
```

---

# 24. 検索機能

## 検索対象

- レシピ名
- 説明
- 材料
- タグ
- メモ

例：

```text
検索

玉ねぎ
```

タイトルに「玉ねぎ」が含まれていなくても、材料に含まれていれば検索結果に含める。

---

# 25. 検索RPC

MVPではシンプルな検索を実装する。

```sql
create or replace function public.search_recipes(
  p_group_id uuid,
  p_query text
)
returns setof public.recipes
language sql
stable
security invoker
set search_path = public
as $$
  select r.*
  from public.recipes r
  where
    r.group_id = p_group_id
    and (
      trim(coalesce(p_query, '')) = ''

      or r.title ilike '%' || p_query || '%'

      or coalesce(r.description, '')
        ilike '%' || p_query || '%'

      or coalesce(r.memo, '')
        ilike '%' || p_query || '%'

      or exists (
        select 1
        from unnest(r.ingredients) ingredient
        where ingredient ilike '%' || p_query || '%'
      )

      or exists (
        select 1
        from unnest(r.tags) tag
        where tag ilike '%' || p_query || '%'
      )
    )
  order by r.updated_at desc;
$$;
```

React：

```ts
const { data, error } = await supabase.rpc(
  'search_recipes',
  {
    p_group_id: groupId,
    p_query: searchText,
  }
)
```

データ量が増え、検索性能が問題になった場合はPGroongaなどの全文検索を検討する。

---

# 26. Row Level Security

すべての主要テーブルでRLSを有効にする。

```sql
alter table public.profiles
enable row level security;

alter table public.groups
enable row level security;

alter table public.group_members
enable row level security;

alter table public.recipes
enable row level security;
```

---

# 27. recipesのアクセス制御

基本ルール：

> 自分が所属しているグループのレシピだけ操作できる。

概念：

```sql
exists (
  select 1
  from public.group_members gm
  where
    gm.group_id = recipes.group_id
    and gm.user_id = auth.uid()
)
```

この条件を以下に適用する。

- SELECT
- INSERT
- UPDATE
- DELETE

イメージ：

```text
User A

group_members
│
└── group_id = ABC

        ↓

recipes

group_id = ABC
→ アクセス可能

group_id = XYZ
→ アクセス不可
```

---

# 28. グループ作成RPC

グループ作成時は、

```text
groups INSERT
```

と

```text
group_members INSERT
```

を1処理として実行する。

RPC：

```text
create_group()
```

処理：

```text
create_group
     │
     ▼
groups作成
     │
     ▼
group_members
     │
     ├── user_id = auth.uid()
     └── role = owner
```

---

# 29. グループ参加RPC

RPC：

```text
join_group()
```

引数：

```text
invite_token
```

処理：

```text
invite_token取得
      │
      ▼
対象group検索
      │
      ▼
group_membersへ追加
      │
      ▼
group_idを返す
```

---

# 30. Reactディレクトリ構成

```text
src/
├── components/
│   ├── Layout/
│   ├── Button/
│   └── Loading/
│
├── features/
│   │
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   │
│   ├── recipes/
│   │   │
│   │   ├── components/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── IngredientEditor.tsx
│   │   │   ├── StepEditor.tsx
│   │   │   ├── TagInput.tsx
│   │   │   └── RecipeSearch.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── getRecipes.ts
│   │   │   ├── getRecipe.ts
│   │   │   ├── createRecipe.ts
│   │   │   ├── updateRecipe.ts
│   │   │   ├── deleteRecipe.ts
│   │   │   └── searchRecipes.ts
│   │   │
│   │   └── types.ts
│   │
│   └── groups/
│       ├── components/
│       └── api/
│
├── pages/
│   ├── LoginPage.tsx
│   ├── SetupPage.tsx
│   ├── RecipeListPage.tsx
│   ├── RecipeDetailPage.tsx
│   ├── RecipeCreatePage.tsx
│   ├── RecipeEditPage.tsx
│   ├── JoinGroupPage.tsx
│   └── SettingsPage.tsx
│
├── hooks/
│   ├── useAuth.ts
│   └── useCurrentGroup.ts
│
├── lib/
│   └── supabase.ts
│
├── types/
│   └── database.ts
│
├── App.tsx
└── main.tsx
```

---

# 31. 主要コンポーネント

## RecipeCard

用途：

- レシピ一覧カード

表示：

- 料理名
- 調理時間
- 人数
- タグ

---

## RecipeForm

用途：

- レシピ新規登録
- レシピ編集

構成：

```text
RecipeForm

├── IngredientEditor
├── StepEditor
└── TagInput
```

---

## IngredientEditor

用途：

材料の追加・削除。

```text
豚肉 300g
玉ねぎ 1/2個

＋ 材料を追加
```

---

## StepEditor

用途：

作り方の追加・削除。

```text
1. 玉ねぎを切る
2. 豚肉を焼く

＋ 手順を追加
```

---

## TagInput

用途：

タグの入力。

```text
#肉
#簡単
#夕食
```

---

## RecipeSearch

用途：

レシピ検索。

```text
🔍 料理名・材料から検索
```

---

## AuthGuard

未ログインの場合：

```text
/login
```

へリダイレクトする。

---

## GroupGuard

ユーザーがグループに所属していない場合：

```text
/setup
```

へリダイレクトする。

---

# 32. API関数

## Recipe

```text
getRecipes()
getRecipe()
createRecipe()
updateRecipe()
deleteRecipe()
searchRecipes()
```

## Group

```text
getCurrentGroup()
createGroup()
joinGroup()
getGroupMembers()
```

## Auth

```text
signIn()
signOut()
getSession()
```

---

# 33. Phase 1：プロジェクト作成

### STEP 1

React + TypeScript + Viteプロジェクトを作成。

### STEP 2

必要なライブラリを追加。

```text
React Router
Supabase JS
React Hook Form
Zod
Tailwind CSS
```

### STEP 3

Supabaseプロジェクト作成。

### STEP 4

ReactからSupabaseへ接続。

---

# 34. Phase 2：基本CRUD

この段階では認証・共有を考えない。

### STEP 5

`recipes` テーブル作成。

### STEP 6

レシピ登録画面作成。

```text
/recipes/new
```

### STEP 7

レシピ一覧画面作成。

```text
/recipes
```

### STEP 8

レシピ詳細画面作成。

```text
/recipes/:id
```

### STEP 9

レシピ編集機能作成。

```text
/recipes/:id/edit
```

### STEP 10

削除機能作成。

---

# 35. Phase 3：フォーム整理

### STEP 11

`RecipeForm` を共通コンポーネント化。

### STEP 12

`IngredientEditor` 作成。

### STEP 13

`StepEditor` 作成。

### STEP 14

`TagInput` 作成。

---

# 36. Phase 4：検索

### STEP 15

キーワード検索作成。

対象：

```text
title
description
ingredients
tags
memo
```

### STEP 16

タグフィルター追加。

---

# 37. Phase 5：認証

### STEP 17

Supabase Authを設定。

### STEP 18

ログイン画面作成。

```text
/login
```

### STEP 19

`useAuth` 作成。

### STEP 20

`AuthGuard` 作成。

### STEP 21

ログイン状態を維持。

---

# 38. Phase 6：ユーザー

### STEP 22

`profiles` テーブル作成。

### STEP 23

新規ユーザー登録時にprofileを作成。

---

# 39. Phase 7：共有

### STEP 24

`groups` テーブル作成。

### STEP 25

`group_members` テーブル作成。

### STEP 26

グループ作成機能。

### STEP 27

`create_group()` RPC作成。

### STEP 28

初期設定画面作成。

```text
/setup
```

---

# 40. Phase 8：RLS

### STEP 29

各テーブルでRLSを有効化。

### STEP 30

ユーザーが所属するグループだけ閲覧できるようにする。

### STEP 31

INSERT / UPDATE / DELETEのRLSを作成。

---

# 41. Phase 9：招待

### STEP 32

グループに `invite_token` を追加。

### STEP 33

招待URLを作成。

```text
/join/:token
```

### STEP 34

`join_group()` RPC作成。

### STEP 35

招待画面作成。

### STEP 36

設定画面から招待URLをコピーできるようにする。

---

# 42. Phase 10：仕上げ

### STEP 37

スマートフォン表示を調整。

### STEP 38

ローディング表示。

### STEP 39

エラーハンドリング。

### STEP 40

空状態UI。

例：

```text
まだレシピがありません。

最初のレシピを登録しましょう。

[＋ レシピを追加]
```

### STEP 41

削除確認ダイアログ。

### STEP 42

Vercelへデプロイ。

---

# 43. 開発順まとめ

```text
Reactプロジェクト作成
        │
        ▼
Supabase接続
        │
        ▼
recipes
        │
        ▼
登録
        │
        ▼
一覧
        │
        ▼
詳細
        │
        ▼
編集
        │
        ▼
削除
        │
        ▼
RecipeForm共通化
        │
        ▼
検索
        │
        ▼
──────────────
個人用アプリ完成
──────────────
        │
        ▼
Auth
        │
        ▼
profiles
        │
        ▼
groups
        │
        ▼
group_members
        │
        ▼
RLS
        │
        ▼
グループ作成
        │
        ▼
招待
        │
        ▼
──────────────
共有アプリ完成
──────────────
        │
        ▼
レスポンシブ調整
        │
        ▼
デプロイ
```

---

# 44. MVP完成条件

以下をすべて満たした時点でMVP完成とする。

## レシピ

- [ ] レシピを登録できる
- [ ] レシピを一覧表示できる
- [ ] レシピ詳細を表示できる
- [ ] レシピを編集できる
- [ ] レシピを削除できる
- [ ] 材料を複数登録できる
- [ ] 作り方を複数登録できる
- [ ] タグを登録できる
- [ ] 調理時間を登録できる
- [ ] 人数を登録できる
- [ ] 参考URLを登録できる
- [ ] メモを登録できる

## 検索

- [ ] 料理名から検索できる
- [ ] 材料から検索できる
- [ ] タグから検索できる
- [ ] メモから検索できる

## Auth

- [ ] ログインできる
- [ ] ログアウトできる
- [ ] ログイン状態を維持できる
- [ ] 未ログインユーザーからデータを保護できる

## 共有

- [ ] グループを作成できる
- [ ] 招待URLを発行できる
- [ ] 招待URLからグループへ参加できる
- [ ] 同じグループのレシピを複数ユーザーで閲覧できる
- [ ] 同じグループのレシピを複数ユーザーで編集できる
- [ ] 他グループのデータへアクセスできない

## UI

- [ ] スマートフォンで使用できる
- [ ] 一覧からレシピへすぐアクセスできる
- [ ] 登録フォームが簡単に使える
- [ ] 料理中でも詳細画面を読みやすい

---

# 45. MVP完成後の候補

MVP完成後は実際の利用状況を見ながら機能を追加する。

## 優先候補

1. 料理画像
2. お気に入り
3. 最近作ったレシピ
4. 「また作りたい」
5. 今日何作る？ランダム表示
6. レシピ複製
7. URLからレシピ取り込み
8. 買い物リスト
9. 献立管理
10. AIによるレシピ整理

---

# 46. 料理画像機能

料理画像はMVPには含めず、MVP完成後に必要性を判断して追加する。

追加する場合はSupabase Storageを使用する。

## Supabase Storage

Bucket：

```text
recipe-images
```

ファイル構成：

```text
recipe-images/
└── {group_id}/
    └── {recipe_id}/
        └── main.webp
```

DBの `recipes` テーブルに以下を追加する。

```sql
alter table public.recipes
add column image_path text;
```

TypeScriptの `Recipe` にも追加する。

```ts
image_path: string | null
```

フォームには以下のコンポーネントを追加する。

```text
RecipeImageUploader
```

最終的な構成：

```text
RecipeForm

├── RecipeImageUploader
├── IngredientEditor
├── StepEditor
└── TagInput
```

料理画像追加時には以下を実装する。

- [ ] Supabase Storage Bucket作成
- [ ] 画像アップロード
- [ ] 画像差し替え
- [ ] 画像削除
- [ ] Storage RLS
- [ ] 一覧画面で画像表示
- [ ] 詳細画面で画像表示
- [ ] スマートフォンから画像選択
- [ ] 必要に応じて画像圧縮・WebP変換

---

# 47. 開発方針

このアプリでは、最初から認証や共有機能を完成させようとしない。

まず、

```text
登録
↓
一覧
↓
詳細
↓
編集
↓
削除
↓
検索
```

というレシピ管理のコア機能を完成させる。

その後、

```text
Auth
↓
Group
↓
RLS
↓
招待
```

を追加する。

これにより、問題が発生したときに原因を切り分けやすくし、段階的にReactとSupabaseの実装を進められるようにする。

最初のマイルストーンは、

> **自分一人でレシピを登録・検索・閲覧できる状態**

とする。

次のマイルストーンを、

> **複数ユーザーで安全に同じレシピ帳を共有できる状態**

とする。

料理画像については、この2つのマイルストーンを達成した後、実際にアプリを使用して必要性を判断してから実装する。