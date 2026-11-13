# Design

## Context

なぜ直すかは proposal.md の Why、求める動作は各 specs を参照。いまのコードで関わるところ:

- `AppContext` の `loadGroup` は、始めに `groupLoading` を `true` にし、所属するレシピノートとメンバーを読む。失敗すると `groups`、`group`、`members` を空にする。`GroupGuard` は `groupLoading` の間は `PageLoader` を出し、`group` がなければ `/setup` に移る。そのため、失敗が未所属に見える（バグ1）
- `onAuthStateChange` は、どのイベントでも `setUser(新しいオブジェクト)` と `loadGroup` を呼ぶ。`getSession()` でも `loadGroup` を呼ぶので、起動時は2回読む。`TOKEN_REFRESHED` や、タブに戻ったときの `SIGNED_IN` でも読み直す。読み直しの間は `GroupGuard` が子を外して `PageLoader` を出すので、フォームが作り直されて入力が消える（バグ6）
- `user` が新しいオブジェクトになると `selectGroup` も作り直され、それに依存する編集画面の effect がもう一度走る。effect はレシピを読み直して `setValues` を呼ぶ。別のレシピノートのレシピなら `selectGroup` で `group` も替わり、同じことが起きる（バグ8）
- `selectGroup` は `members` を `[]` にしてから読む。設定画面は、オーナーが見つからないと `user.displayName` を、メンバー数に `members.length` を出す（バグ7）。詳細画面は `members` を使わず、`user.displayName` を登録者として出す（バグ2）
- `getRecipe(id)` と `getInviteGroup(token)` は値をそのまま PostgREST に渡す。UUID の形でないと `22P02 invalid input syntax for type uuid` が返り、画面は `getErrorMessage` でその文言を出す（バグ4、5）。招待画面は、形は正しいが当たらないトークンで `null` が返ると、エラーも招待内容も出さず空になる
- `search_recipes`（初期のマイグレーション）は `ilike '%' || p_query || '%'` で、キーワードをエスケープしない（バグ3）。デモの `getDemoRecipes` は `includes` で文字どおりに比べている

## Goals / Non-Goals

**Goals:**

- 「読み込み中」「読み込みに失敗」「未所属」を別の状態として持ち、画面ごとに出し分ける
- 同じ利用者のままのセッションのイベントでは、レシピノートを読み直さず、`user` のオブジェクトも替えない
- 形の正しくない ID やトークンは、問い合わせる前に「見つからない」「無効」として扱う
- 検索のキーワードを、Supabase でもデモと同じく文字どおりに扱う

**Non-Goals:**

- 読み込みの失敗からの自動の再試行や、オフラインの検出
- 退会したメンバーの名前の取得（`profiles` を別に引くことはしない）
- エラーの文言の全体的な日本語化（`getErrorMessage` は変えない）

## Decisions

### 1. 読み込みの失敗を状態として持つ（バグ1）

`AppContext` に `groupError: boolean` を足す。`loadGroup` は始めに `false` にし、失敗したら `true` にする。失敗したときは `groups`、`group`、`members` を空にせず、前の値を残す。

- `GroupGuard` と `RootRedirect` は、`groupLoading` → `groupError` → `!group` の順に判定する。`groupError` のときは新しい共通部品 `src/components/GroupLoadError.tsx` を出す。中身は「レシピノートを読み込めませんでした。通信の状態を確かめて、もう一度読み込んでください。」と「もう一度読み込む」ボタン
- ボタンは、いまある `refreshGroup` を呼ぶ。`group` がなければ `loadGroup(user, undefined)` となり、覚えているレシピノートを開く。新しい関数は足さない
- 見た目は、いまの `EmptyState` か `alertErrorClassName` と `Button` を組み合わせる。スマホ幅を基準にし、PC でも同じ中央寄せの1列にする。新しいトークンやクラスは足さない

案として、失敗を未所属と区別せず `/setup` で「読み込めませんでした」を出す方法も考えた。しかし `/setup` はレシピノートを作る画面なので、新しいレシピノートを作らせてしまう問題が残る。そのため採らない。

### 2. 同じ利用者ならセッションのイベントで読み直さない（バグ6）

`AppContext` に `loadedUserIdRef`（`useRef<string | null>`）を持つ。`onAuthStateChange` と `getSession()` のどちらでも、次のようにする。

- `nextUser?.id` が `loadedUserIdRef.current` と同じなら、`loadGroup` を呼ばない。`TOKEN_REFRESHED`、タブに戻ったときの `SIGNED_IN`、起動時の2回目がこれに当たる
- 違うとき（ログイン、ログアウト、別のアカウント）だけ、ref を更新して `loadGroup` を呼ぶ。ログアウトでは `null` にする
- `setUser` は関数の形で呼ぶ。`id`、`email`、`displayName` が前と同じなら前のオブジェクトを返し、`user` に依存する `selectGroup` などが作り直されないようにする

イベントの種類（`TOKEN_REFRESHED` など）で分ける案も考えた。しかし supabase-js は、タブに戻ったときにも `SIGNED_IN` を出すことがある。また種類での判定では、起動時に2回読むことも防げない。利用者の ID で比べるほうが、どちらにも効く。

失敗の後は ref が同じ利用者のままなので、トークンの更新では読み直さない。もう一度読むのは、ボタンを押したときだけにする（自動の再試行は対象外）。

### 3. メンバーの読み込み中を状態として持つ（バグ7、2）

`AppContext` に `membersLoading: boolean` を足す。`loadGroup` と `selectGroup` でメンバーを読む間は `true` にする。

- `selectGroup` は、読み始めたときのレシピノートの ID を ref に覚えておく。結果が返ったときに ID が違えば、その結果は捨てる（続けて切り替えたときに、前のレシピノートのメンバーが入らないように）
- 設定画面のオーナーとメンバー数: `membersLoading` の間は値を出さず、「…」を出す。読み終えてもオーナーが見つからなければ「メンバー」と出し、`user.displayName` には頼らない
- 詳細画面の登録者: `members.find((m) => m.user_id === recipe.created_by)` を `getMemberDisplayName(member, user)` に通す。見つからなければ「メンバー」と出す。`membersLoading` の間は「登録者」の欄を出さない
- デモ: `demoData` のレシピは3件とも `created_by` が `DEMO_USER_ID` で、デモのメンバーにその利用者がいる。そのため、そのまま名前が出る。デモのデータは変えない

### 4. UUID の形を問い合わせの前に確かめる（バグ4、5）

`src/lib/uuid.ts` に `isUuid(value: string): boolean` を足す（`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`）。

- `getRecipe`: Supabase 接続で `isUuid(id)` でなければ、問い合わせずに `null` を返す。詳細画面と編集画面は、いまの `null` の扱い（「見つかりません」）のままにする。デモの ID は UUID の形でないため、デモの分岐の後で確かめる
- `getInviteGroup`: `isUuid(token)` でなければ `null` を返す。招待画面は `null` のときに「招待リンクが無効です」を出し、理由として「招待リンクのURLが正しくないか、レシピノートが見つかりません。」を出す。これで、形は正しいが当たらないトークンで画面が空になる問題も一緒に直る
- `22P02` のエラーを受けてから文言を置き換える案も考えた。しかし問い合わせが無駄になり、エラーの種類ごとの判定がほかにも広がるので採らない

### 5. 編集画面はレシピごとに一度だけ値を入れる（バグ8）

編集画面に `loadedRecipeIdRef` を持つ。effect の始めで、URL の `id` が ref と同じなら何もしない（読み直しも `selectGroup` も `setValues` もしない）。値を入れたときに ref を `id` にする。`group` や `groups` が替わって effect が走り直しても、フォームは作り直されない。URL の `id` が替わったときは、ref と違うので読み直す。

`RecipeForm` の `defaultValues` を `useMemo` で固定する案も考えた。しかし effect がもう一度走って `setValues` を呼ぶことは変わらず、`loading` の切り替えでフォームが外れることも防げないので採らない。

### 6. 検索のキーワードをエスケープする（バグ3）

新しいマイグレーション `supabase/migrations/20261114000000_escape_search_pattern.sql` で、`search_recipes` を `create or replace` する。

- 関数の始めでパターンを一度作る。`'%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%'` を作り、各列で `ilike <pattern> escape '\'` とする。関数は `language sql` のままにし、パターンは `with` 句かサブクエリで一度だけ組み立てる
- 引数、戻り値、`security invoker`、`search_path`、`grant` は変えない。RLS はいまのまま `security invoker` で効くので、影響はない
- テーブルの形は変わらないので、`seed.sql` には影響がない。`npm run db:reset` で当たることを確かめる
- デモの `getDemoRecipes` は、すでに文字どおりに比べているので変えない

## Risks / Trade-offs

- [Risk] 同じ利用者のイベントで読み直さないため、ほかの端末でレシピノートに参加したことが、タブに戻っただけでは反映されない → いまも、それを当てにした仕様はない。再読み込みかボタンで反映される
- [Risk] `groupError` のときに前の `group` を残すと、古い情報が見える → 失敗の表示は `GroupGuard` が画面全体に出すので、古い一覧の上で操作することはない
- [Risk] `isUuid` が大文字や、いまの PostgreSQL が受け付ける別の書き方（波かっこ付きなど）を弾く → アプリが作るリンクは小文字のハイフン区切りだけなので、困らない。大文字は `i` フラグで通す
- [Risk] トークンの更新を手元で起こしにくく、確認しにくい → `supabase.auth.refreshSession()` を開発者ツールから呼ぶか、`onAuthStateChange` のイベントの後に入力が残ることを確かめる

## Migration Plan

1. 手元で `npm run db:reset` を流し、マイグレーションと `seed.sql` が当たることを確かめる
2. PR をマージする前後に、利用者が本番の Supabase にマイグレーションを当てる（`npx supabase db push`、または SQL Editor）。関数の置き換えだけなので、アプリのデプロイとの順番はどちらでもよい
3. 戻すときは、初期のマイグレーションの `search_recipes` の定義を `create or replace` で当て直す
