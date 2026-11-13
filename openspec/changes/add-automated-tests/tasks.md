# Tasks

## 1. テストの仕組み

- [x] 1.1 `vitest`、`@testing-library/react`、`@testing-library/user-event`、`@testing-library/jest-dom`、`jsdom` を開発用の依存に足し、`vite.config.ts` に `test` の設定（jsdom、`src/test/setup.ts`）、`package.json` に `test` と `test:watch` を足す（design の決定1）。仮のテストを1つ置いて `npm test` が通り、消してから次に進む
- [x] 1.2 `tsconfig.app.json` からテストのファイルを外し、`tsconfig.test.json` を足して `tsconfig.json` の `references` に入れる（design の決定2）。`npm run build` が通り、テストのファイルの型の誤りが `npm run build` で検出されることを確かめる

## 2. ロジックのテスト

- [x] 2.1 `isUuid`、`getErrorMessage`、`getMemberDisplayName`、`recipeToFormValues` のテストを書く（design の決定5）。`npm test` が通ることを確かめる
- [x] 2.2 `getDemoRecipes` と `getDemoRecipe` のテストを書く（検索の対象と対象外、大文字と小文字、`%` と `_`、ない ID）。`npm test` が通ることを確かめる
- [x] 2.3 `RecipeForm.tsx` のスキーマを `src/features/recipes/recipeFormSchema.ts` に移し（design の決定3）、`recipeSchema` のテストを書く（必須、上限ちょうどと1つ超え、空の行、何行目のエラーか、URL、数値の範囲）。`npm test` と `npm run build` が通ること、Supabase Local の追加画面で上限を超えたときのエラーがいままでどおり出ることを確かめる

## 3. Edge Function の整形のテスト

- [x] 3.1 `recipe-draft` の `LIMITS`、入力の上限、`draftSchema`、`parseDraft` を `draft.ts` に移し、`deno.json` の `imports` で `zod` と `@supabase/supabase-js` を解決するようにする（design の決定3、4）。Supabase Local を起動し直し、AI の下書きがいままでどおり返ることを確かめる
- [x] 3.2 `parseDraft` のテストと、上限・入力の上限・`zod` の版がアプリと Edge Function でそろっていることのテストを書く（design の決定5）。`npm test` が通ること、わざと値をずらすとテストが失敗することを確かめる

## 4. 画面の部品のテスト

- [x] 4.1 `TagInput` のテストを書く（Enter とカンマ、変換中の Enter、上限、重複）。`npm test` が通ることを確かめる
- [x] 4.2 `RecipeForm` のテストを書く（エラーで保存されない、正しい値で `onSubmit`、`disableSave`、文字数の表示）。`npm test` が通ることを確かめる
- [x] 4.3 `RootRedirect`、`AuthGuard`、`GroupGuard` を `src/components/RouteGuards.tsx` に移し（design の決定3）、`GroupGuard` のテストを書く（読み込み中、失敗と「もう一度読み込む」、未所属、所属）。`npm test`、`npm run lint`、`npm run build` が通ること、Supabase Local で一覧・設定・セットアップ画面への移動がいままでどおりであることを確かめる

## 5. データベースのテスト

- [x] 5.1 `package.json` に `db:test` を足し、`supabase/tests/rls.test.sql` を書く（design の決定6）。`npm run db:test` が通ること、わざとポリシーを緩めると失敗することを確かめ、`npm run db:reset` で戻す
- [x] 5.2 `supabase/tests/rpc.test.sql` を書く。`npm run db:test` が通ることを確かめる
- [x] 5.3 `supabase/tests/search.test.sql` を書く。`npm run db:test` が通ること、検索の関数を初期のマイグレーションの定義（エスケープなし）に戻すと失敗することを確かめ、`npm run db:reset` で戻す
- [x] 5.4 `supabase/tests/constraints.test.sql` を書く。`npm run db:test` が通ることを確かめる

## 6. CI と説明

- [x] 6.1 手元で `npx supabase stop` の後、design の決定7と同じ `npx supabase start -x ...`（Google の値はダミー）で起動し、`npx supabase test db` が通ることを確かめる。確かめた後は、いつもの `npm run db:start` で起動し直す
- [x] 6.2 `.github/workflows/ci.yml` を足す（design の決定7）。PR を作って app と db の2つのジョブが通ることを確かめる（PR の作成は 7章の後でもよい）
  - 確認結果: PR #18 で CI が動き、app のジョブ（lint、build、Vitest 10ファイル・55件、19秒）と db のジョブ（Supabase Local の起動と pgTAP 4ファイル・65件、1分22秒）の両方が通った
- [x] 6.3 AGENTS.md の Testing Guidelines と README のコマンドの表を更新する（design の決定8）。書いたコマンドがそのとおりに動くことを確かめる

## 7. 確認

- [x] 7.1 `npm run lint`、`npm run build`、`npm test`、`npm run db:test` がエラーなしで通ることを確かめる
- [x] 7.2 Supabase Local で、レシピの追加・編集（上限のエラー、タグの入力）、AI の下書き、レシピノートの読み込みと切り替えが、いままでどおり動くことを確かめる（切り出しで動作が変わっていないこと）
  - 確認結果: 自動で確かめた（利用者と相談して決定）。テスト用のセッションでヘッドレスの Chrome を DevTools Protocol で操作した。追加画面で、AI の下書きから料理名・材料・作り方・人数が入った（OpenRouter への問い合わせ1回）。タグを＋で追加でき、101文字の料理名では「料理名は100文字以内にしてください。」が出て保存されず、直すと保存されて詳細画面に移った。編集画面で料理名を変えて保存すると、詳細画面に反映された。ヘッダーからゆきのノートに切り替えると一覧が「チキンカレー」になり、サンプルのレシピノートのレシピの URL を開くと元に戻った。確かめた後は `npm run db:reset` で、作ったレシピを消した
- [x] 7.3 デモモードで、一覧・検索・詳細・編集画面（保存できない）が、いままでどおり動くことを確かめる
  - 確認結果: 自動で確かめた（利用者と相談して決定）。「デモのレシピを見る」から入り、一覧に3件が新しい順に出た。「玉ねぎ」の検索で2件、詳細画面に「登録者 デモユーザー」と出て削除ボタンはなかった。編集画面には既存の値が入り、上下の「変更を保存」は無効で、保存できない旨が出た

## Workflow follow-up

- PR を作り、CI の2つのジョブの結果を載せる。画面は変わらないのでスクリーンショットは不要
- マージの前に `archive` ラベルを付けて、この変更をアーカイブする（仕様の変更はない）
- （利用者の作業）マージの後、本番の Edge Function を再デプロイする（`npx supabase functions deploy recipe-draft`）。本番で AI の下書きが返ることを確かめる
