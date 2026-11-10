# Proposal

## Why

手元での確認には、環境変数がないときに localStorage でデータを持つローカルプレビューモードを使っている。ローカルプレビューは RLS も RPC も通らないため、データの共有や招待の動きは本物と同じには確かめられない。Supabase接続モードを手元で確かめるには、Vercel と共有している本番の Supabase に直接つなぐしかなく、確認のたびに本番のデータを触っている。マイグレーションも本番に当てるまで確かめられない。さらに、ログイン、レシピノート、レシピの処理が Supabase と localStorage で二重に実装されている。手元でも本物と同じ Supabase（Supabase Local）を使うようにし、本番の DB に触れずに確かめられるようにし、二重の実装をなくす。

## What Changes

データ、API、開発環境の変更を含む。画面の変更は、ログイン画面のメール入力のフォームの削除と、接続設定がないときの画面の追加だけ。スキーマ（マイグレーション）は変えない。

- ローカルプレビューモードを削除する
  - localStorage でデータを持つ処理（`src/lib/localStorage.ts`）と、Supabase と localStorage を切り替える分岐を削除する
  - ログイン画面のメールアドレスを入力するログインと、設定画面とサイドバーのローカルプレビューの表示を削除する
  - ローカルプレビュー中を表す `isDemoMode`（デモモードと紛らわしい名前）を削除する
- 接続設定（URL と公開可能キー）がないときは、設定がないことと準備の手順を知らせる画面を表示する。この画面からデモのレシピを見ることはできる
- 手元の開発では Supabase Local を使う
  - Supabase CLI を npm の開発用の依存として追加し、起動、停止、作り直しの npm スクリプトを用意する
  - `supabase/config.toml` を追加し、Google ログイン、ログイン後の戻り先（localhost）を設定する。Google の OAuth のシークレットは Git の管理外のファイルから読む
  - `supabase/seed.sql` を追加し、ログインしないサンプル用のユーザー、サンプルのレシピノート、サンプルのレシピ（いまのローカルプレビューの初期データ）を入れる。サンプルのレシピノートの招待トークンは決まった値にし、手元で Google ログインした後に招待リンクから参加できるようにする
  - `.env.local` は Supabase Local の接続先だけを書く。本番の接続先は Vercel の環境変数にだけ置く
- デモモードはいまのまま残す（Supabase を使わない固定データ）
- README.md、AGENTS.md、`openspec/config.yaml` の動作モードと確認手順を、Supabase接続（手元では Supabase Local）とデモの2つに書き換える

対象外:

- スキーマ、RLS、RPC の変更（既存のマイグレーションをそのまま Supabase Local に当てる）
- 本番の Supabase と Vercel の設定の変更（本番の動きは変わらない）
- 自動テストや CI の追加
- ログイン方法の追加（手元でも Google ログインだけを使う）

影響する動作モード:

- Supabase接続: 本番の動きは変わらない。手元では Supabase Local につないで同じ動きをする
- ローカルプレビュー: 削除する
- デモ: 変わらない。接続設定がないときも、知らせる画面からデモを開ける

手元の準備で必要な作業（リポジトリの外、利用者が行う）:

- OrbStack を入れる
- Google Cloud の OAuth クライアントに、戻り先 `http://127.0.0.1:54321/auth/v1/callback` を追加する
- Google の OAuth のシークレットを Git の管理外のファイルに置く
- `.env.local` を Supabase Local の接続先に書き換える

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `app-modes`: 接続設定がないときはローカルプレビューではなく、設定がないことを知らせる画面を表示する。ローカルプレビューのデータ保存の要件を削除する
- `auth`: ローカルプレビューでのログインの要件を削除する

## Impact

- 削除: `src/lib/localStorage.ts`
- 変更: `src/contexts/AppContext.tsx`、`src/contexts/app-context.ts`、`src/features/recipes/api/recipes.ts`、`src/features/groups/api/groups.ts`、`src/pages/LoginPage.tsx`、`src/pages/SettingsPage.tsx`、`src/components/Layout/AppShell.tsx`、`src/lib/supabase.ts`
- 追加: 接続設定がないときの画面（`src/pages/SupabaseSetupPage.tsx`）。`src/App.tsx` で表示を切り替える
- 変更: `.env.example`（Supabase Local の接続先の例）
- 追加: `supabase/config.toml`、`supabase/seed.sql`、npm スクリプト（Supabase Local の起動、停止、作り直し）
- 依存パッケージ: `supabase`（Supabase CLI）を開発用の依存として追加。アプリの依存は増えない
- `.gitignore`: Supabase CLI が作るファイルと、シークレットを置くファイルを追加
- 文書と設定: `README.md`、`AGENTS.md`、`openspec/config.yaml`
- スキーマ、RLS、マイグレーション: 変更なし
- localStorage のデータ形式: ローカルプレビューのデータは使わなくなる（デモモードの sessionStorage はそのまま）
