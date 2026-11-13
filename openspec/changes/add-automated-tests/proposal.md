# Proposal

## Why

いまは自動テストがなく、変更のたびに lint と build のあと、ヘッドレスの Chrome や `psql` で手作業に近い確認をしている。入力の上限、検索の記号、RLS、トークンの更新での読み直しなど、一度直したものが後の変更で壊れても気づけない。よく壊れやすいところを自動テストで守り、PR ごとに GitHub Actions で実行する。

## What Changes

開発の仕組みだけの変更。利用者に見える動作、データ、API、ルーティングは変えない（テストしやすくするための関数の切り出しは、動作を変えない範囲で行う）。

- Vitest を入れ、`npm test` で実行できるようにする
- **ロジックのテスト**（Vitest）: 画面を使わない関数
  - `isUuid`、`getErrorMessage`、`getMemberDisplayName`
  - デモの検索（`getDemoRecipes`）とデモのレシピの取得
  - レシピとフォームの値の変換（`recipeToFormValues`）
  - レシピのフォームの検証（入力の上限、必須、URL の形）。いまは `RecipeForm.tsx` の中にあるスキーマを、別のファイルに切り出してテストする
  - AI の下書きの整形（Edge Function `recipe-draft` の整える処理）と、上限の値がフォーム・Edge Function でそろっていること
- **画面の部品のテスト**（Vitest ＋ React Testing Library、jsdom）
  - タグの入力（変換中の Enter で追加しない、上限）
  - レシピのフォーム（上限を超えるとエラー、保存ボタン、デモで保存できない）
  - レシピノートの読み込みの失敗で、セットアップ画面に移らず「もう一度読み込む」が出ること（`GroupGuard`）
- **データベースのテスト**（pgTAP、`supabase test db`）: Supabase Local に対して
  - RLS: 所属していないレシピノートのレシピ・メンバー・レシピノートが見えない、変更できない
  - RPC: レシピノートの作成・参加・名前の変更（オーナーだけ）、招待トークンでの取得
  - 検索の関数: 記号を文字どおりに扱う、所属していないレシピノートは返さない
  - 入力の上限の制約
- **GitHub Actions**: PR ごとに lint・build・Vitest を実行し、別のジョブで Supabase Local を起動して pgTAP を実行する
- AGENTS.md と README のテストの説明を更新する（「自動テストはない」の記述を直す）

対象外:

- ブラウザを通した E2E テスト（Playwright など）。今回の変更で使ったヘッドレスの Chrome の確認は、引き続き手動の確認として扱う
- カバレッジの目標値
- 本番の Supabase に対するテスト
- 既存のコードの、テストのため以外のリファクタリング

影響する動作モード: どちらのモードの動作も変わらない。テストは Supabase 接続（Supabase Local）とデモの両方のロジックを対象にする。

## Capabilities

### New Capabilities

なし

### Modified Capabilities

なし（利用者に見える動作が変わらないため、仕様の変更はない。`.openspec.yaml` に `skip_specs: true` を設定する）

## Impact

- 追加する開発用の依存: `vitest`、`@testing-library/react`、`@testing-library/user-event`、`@testing-library/jest-dom`、`jsdom`
- 追加: `vitest.config.ts`（または `vite.config.ts` の `test` の設定）、`src/**/*.test.ts(x)`、`supabase/tests/*.test.sql`、`.github/workflows/ci.yml`
- 変更: `package.json`（`test` と `db:test` のスクリプト）、`src/features/recipes/components/RecipeForm.tsx`（スキーマの切り出し）、`supabase/functions/recipe-draft/`（整える処理の切り出しと import の解決）、AGENTS.md、README
- スキーマ、RLS、`seed.sql`、本番の環境: 変更なし
- CI の実行時間: Supabase Local の起動を含むジョブは数分かかる
