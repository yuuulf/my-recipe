# Design

## Context

なぜ入れるかと対象は proposal.md を参照。いまの状態:

- `package.json` のスクリプトは `dev`、`build`（`tsc -b && vite build`）、`lint`（oxlint）と `db:*` だけ。テストの依存はない
- `tsconfig.app.json` は `src` 全体を型チェックする。`vite.config.ts` は React と Tailwind のプラグインだけ
- レシピのフォームの zod のスキーマは `RecipeForm.tsx` の中にあり、外から使えない
- ルートの守り（`RootRedirect`、`AuthGuard`、`GroupGuard`）は `App.tsx` の中にあり、外から使えない
- Edge Function `recipe-draft` は Deno で動き、`npm:zod@4.6.5` のように `npm:` で読み込む。整える処理（`draftSchema`、`parseDraft`）と上限（`LIMITS`）は `index.ts` の中にあり、`Deno.serve` と同じファイル
- Supabase Local は Docker で動き、`supabase/config.toml` は Google の OAuth の値を `env(...)` で読む（手元では `supabase/.env`）
- GitHub Actions にはアーカイブ用のワークフローだけがある（`actions/checkout@v4`、`actions/setup-node@v4` で Node.js 22）

## Goals / Non-Goals

**Goals:**

- `npm test` で、ネットワークも Supabase も使わずに数秒で終わるテスト（ロジックと画面の部品）を実行できる
- `npm run db:test` で、Supabase Local に対して RLS・RPC・検索の関数・制約のテストを実行できる
- PR ごとに、両方を GitHub Actions で実行する
- テストのための切り出しで、動作を変えない

**Non-Goals:**

- E2E（ブラウザ全体）のテスト、カバレッジの目標値
- ページ全体（`RecipeListPage` など、Supabase の呼び出しを含む画面）のテスト。Supabase の呼び出しをまねる仕組みは入れない
- 本番の Supabase に対するテスト

## Decisions

### 1. テストの道具は Vitest と React Testing Library

- Vitest: Vite の設定と変換をそのまま使えるので、TypeScript、JSX、`import.meta.env` が追加の設定なしで動く。Jest は Babel か ts-jest の設定が別に要るので採らない
- 画面の部品: `@testing-library/react`、`@testing-library/user-event`、`@testing-library/jest-dom`、`jsdom`
- 設定: `vite.config.ts` に `test` の欄を足す（`environment: 'jsdom'`、`setupFiles: ['src/test/setup.ts']`）。setup で `@testing-library/jest-dom/vitest` を読み込み、テストごとに `cleanup` する。`globals` は使わず、`describe`、`it`、`expect` は `vitest` から import する（どこから来たかが分かるように）
- スクリプト: `"test": "vitest run"`、`"test:watch": "vitest"`
- テストのファイルは、対象の隣に `*.test.ts(x)` で置く

### 2. テストのファイルの型チェック

テストも `tsc -b`（`npm run build`）で型をチェックする。ただし本番のビルドの設定とは分ける。

- `tsconfig.app.json` の `exclude` に `src/**/*.test.ts`、`src/**/*.test.tsx`、`src/test` を足す
- `tsconfig.test.json` を足し、テストのファイルと `src/test` を含め、`types` に `vite/client`、`node`、`@testing-library/jest-dom` を入れる。`tsconfig.json` の `references` に足す

テストを型チェックしない案（Vitest は型を見ない）も考えたが、テストの中の型の誤りに気づけないので採らない。

### 3. テストしやすくするための切り出し（動作は変えない）

- **レシピのフォームのスキーマ**: `RecipeForm.tsx` の `recipeSchema` と、その部品（`optionalNumber`、`maxText`、`rowList`）を `src/features/recipes/recipeFormSchema.ts` に移して export する。`RecipeForm.tsx` はそれを import する。中身は変えない
- **ルートの守り**: `App.tsx` の `RootRedirect`、`AuthGuard`、`GroupGuard` を `src/components/RouteGuards.tsx` に移して export する。`App.tsx` から部品を export すると、oxlint の `react/only-export-components` の警告が出るため
- **AI の下書きの整形**: `supabase/functions/recipe-draft/index.ts` から `LIMITS`、`draftSchema`、`parseDraft` を `supabase/functions/recipe-draft/draft.ts` に移して export する。`index.ts` は `./draft.ts` を import する

### 4. Edge Function の import を Node でも解決できるようにする

`draft.ts` は `zod` を `npm:` ではなく `zod` で import する。Deno では、関数のフォルダーに `supabase/functions/recipe-draft/deno.json` を置き、`"imports": { "zod": "npm:zod@4.6.5" }` で解決する。Vitest（Node）では、アプリの依存の `zod` が解決される。

- `index.ts` の `@supabase/supabase-js` も同じく `deno.json` の `imports` に移し、読み込みの書き方をそろえる
- アプリの `zod` のバージョン（`package.json` の `^4.6.5`）と、`deno.json` の版がずれないよう、上限のテストと同じ場所でバージョンも比べるテストを置く
- 切り出しの後に、Supabase Local の Edge Function が今までどおり下書きを返すことを確かめる（`supabase start` で起動し直す）

`draft.ts` をアプリ側にコピーする案は、2つが食い違う元になるので採らない。Deno のテスト（`deno test`）を別に使う案は、Deno を mise と CI に足す必要があるので採らない。

### 5. 何をテストするか

**ロジック（`*.test.ts`）**

| 対象 | 主な場面 |
|---|---|
| `isUuid` | 小文字・大文字の UUID、欠けた値、空、余計な文字 |
| `getErrorMessage` | Error、文字列、それ以外での代わりの文言 |
| `getMemberDisplayName` | プロフィールの名前、自分の表示名、どちらもないときの「メンバー」 |
| `getDemoRecipes`、`getDemoRecipe` | 料理名・説明・メモ・材料・タグでの検索、作り方は対象外、大文字と小文字、`%` と `_` が文字どおり、ない ID |
| `recipeToFormValues` | null の項目が空文字や `undefined` になる |
| `recipeSchema` | 必須、各項目の上限ちょうどと1つ超え、空の行は数えない、何行目のエラーか、URL の形、調理時間と人数の範囲 |
| `parseDraft`（Edge Function） | JSON でない、型の違う項目、上限での切り詰め、長いタグと長い URL は除く、`#` の除去と重複、何も読めないときの `null` |
| 上限がそろっていること | `RECIPE_LIMITS` と Edge Function の `LIMITS` の値が同じ。`RECIPE_DRAFT_MAX_LENGTH` と Edge Function の入力の上限が同じ |

**画面の部品（`*.test.tsx`、jsdom）**

| 対象 | 主な場面 |
|---|---|
| `TagInput` | Enter とカンマで追加、変換中（`isComposing`、`keyCode` 229）の Enter では追加しない、21文字と11個目は追加せずメッセージ、重複 |
| `RecipeForm` | 料理名が空や上限を超えると保存されずエラー、正しい値で `onSubmit` が呼ばれる、`disableSave` で保存ボタンが無効、文字数の表示 |
| `GroupGuard` | 読み込み中は読み込みの表示、失敗は「もう一度読み込む」でボタンが `refreshGroup` を呼ぶ、未所属は `/setup` に移る、所属していれば中身を出す |

部品は `AppContext.Provider` に値を直接渡し、`MemoryRouter` で包んで描画する。`AppProvider`（Supabase を呼ぶ）は使わない。

### 6. データベースのテストは pgTAP と `supabase test db`

- `supabase/tests/*.test.sql` に置き、`"db:test": "supabase test db"` で実行する。Supabase CLI が pgTAP を用意し、`pg_prove` で各ファイルを実行する
- 各ファイルは `begin;` から `select plan(n);` で始め、`select * from finish(); rollback;` で終える。データは各ファイルの中で、seed とぶつからない固定の UUID で作り、ロールバックで消す。`seed.sql` の中身には頼らない（seed を変えてもテストが壊れないように）
- 利用者として動かすときは、`set local role authenticated` と `set_config('request.jwt.claims', '{"sub": "...", "role": "authenticated"}', true)` を使う。テストの合間に `reset role` で `postgres` に戻ってデータを用意する
- ファイルの分け方:
  - `rls.test.sql`: 所属していないレシピノートのレシピ・メンバー・レシピノート・プロフィールが見えない。他人のレシピノートへの追加・更新・削除ができない。`created_by` を偽った追加ができない
  - `rpc.test.sql`: `create_group`（名前の上限、作った人がオーナー）、`join_group`（参加、すでにメンバーなら同じ ID）、`rename_group`（オーナーだけ、上限）、`get_group_by_invite_token`（当たる・当たらない）
  - `search.test.sql`: キーワードの `%`、`_`、`\` が文字どおり、大文字と小文字を区別しない、作り方は対象外、所属していないレシピノートは0件、新しい順
  - `constraints.test.sql`: 入力の上限の制約が、上限ちょうどを通し1つ超えを拒否する（料理名、説明、材料、作り方、タグ、調理時間、人数、参考URL、メモ）
- 手元では Supabase Local が起動していれば `npm run db:test` で実行できる

### 7. GitHub Actions

`.github/workflows/ci.yml` を足し、`pull_request` と `main` への `push` で動かす。ジョブは2つ。

- **app**: `actions/checkout@v4`、`actions/setup-node@v4`（Node.js 22、npm のキャッシュ）、`npm ci`、`npm run lint`、`npm run build`、`npm test`
- **db**: `npm ci` の後、`npx supabase start` で Supabase Local を起動し、`npx supabase test db` を実行する
  - 使わないサービスは起動しない（`-x studio,imgproxy,mailpit,realtime,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta`）。認証のサービスは、マイグレーションと seed が `auth` スキーマを使うので残す
  - `config.toml` が読む Google の OAuth の値は、ダミーの値を環境変数で渡す（`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`、`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`）。本物の秘密は使わない
- 権限は `contents: read` だけにする。同じ PR で古い実行が残らないよう、`concurrency` で前の実行を止める

Node.js の版は、いまのワークフローと同じく `setup-node` に 22 を書く。mise の action を使う案もあるが、既存のワークフローとそろえるほうを選ぶ。

### 8. 説明の更新

- AGENTS.md の Testing Guidelines: 「自動テストはない」を、Vitest と pgTAP の場所、`npm test` と `npm run db:test`、テストのファイルの置き方、PR ごとの CI に書き換える。手動の確認（Supabase Local での画面、RLS、デモ）は引き続き必要と残す
- README のコマンドの表に `npm test` と `npm run db:test` を足す

## Risks / Trade-offs

- [Risk] jsdom は本物のブラウザと違い、変換中の入力やフォーカスの動きを完全には再現しない → 変換中の Enter は `isComposing` と `keyCode` を付けたイベントで確かめる。見た目やブラウザごとの違いは、引き続き手動で確かめる
- [Risk] CI の db のジョブは、Supabase Local の Docker イメージの取得で数分かかる → 使わないサービスを起動しない。app のジョブと並べて動かし、待ち時間を短くする
- [Risk] `deno.json` を置くことで、本番の Edge Function のデプロイの解決の仕方が変わる → 切り出しの後に Supabase Local で下書きが返ることを確かめる。本番へは、マージの後に利用者が `npx supabase functions deploy recipe-draft` で再デプロイし、下書きが返ることを確かめる
- [Risk] Supabase CLI の版によって `-x` で指定できるサービスの名前が違う → 手元の CLI（2.122.0）で同じコマンドを実行して確かめてから、ワークフローに書く
- [Trade-off] Supabase の呼び出しを含むページはテストしない → ページはこれまでどおり手動の確認で守る。データの規則はデータベースのテスト、部品の動きは部品のテストで守る

## Migration Plan

1. 依存とテストを足し、手元で `npm test` と `npm run db:test` が通ることを確かめる
2. PR を作ると、CI の2つのジョブが動く。両方通ることを確かめる
3. マージの後、本番の Edge Function を再デプロイする（`deno.json` と切り出しを反映するため）。下書きが返ることを確かめる
4. 戻すときは、ワークフローとテストを消し、切り出したファイルを元に戻す。データベースと本番のデータには影響しない
