# Tasks

## 1. Supabase Local の準備

- [x] 1.1 （利用者の作業）OrbStack を入れて起動し、`docker version` が通ることを確かめる
- [x] 1.2 `supabase` パッケージ（公開から2週間以上たった安定版）を `devDependencies` に入れ、`db:start`、`db:stop`、`db:reset`、`db:status` の npm スクリプトを足す（design の決定3）。`npx supabase --version` が表示されることを確かめる
- [x] 1.3 `npx supabase init` で `supabase/config.toml` を作り、`project_id`、`site_url`、`additional_redirect_urls`、メールでの新規登録の無効化、Google ログインの設定を design の決定4のとおりに直す。`git check-ignore supabase/.env` で `supabase/.env` が Git の管理外であることを確かめる
- [x] 1.4 （利用者の作業）Google Cloud の OAuth クライアントの承認済みのリダイレクト URI に `http://127.0.0.1:54321/auth/v1/callback` を足し、クライアント ID とシークレットを `supabase/.env` に書く
  - 確認結果: `supabase/.env` にクライアント ID（`.apps.googleusercontent.com` で終わる）とシークレット（`GOCSPX-` で始まる）が入っていることを、値を表示せずに確かめた。Supabase Local の `/auth/v1/authorize` から Google に転送し、Google が戻り先 `http://127.0.0.1:54321/auth/v1/callback` でエラーを出さずにアカウント選択の画面に進むことを確かめた
- [x] 1.5 `supabase/seed.sql` に、サンプル用のユーザー、サンプルのレシピノート（決まった招待トークン）、オーナーの所属、サンプルのレシピ3件を書く（design の決定5）。`npm run db:start` と `npm run db:reset` がエラーなしで通り、`profiles` にサンプル用のユーザーの行ができ、レシピが3件入っていることを、Supabase Studio（`npm run db:status` に表示される URL）で確かめる
  - 確認結果: `npm run db:start`（初回）と `npm run db:reset` で、マイグレーション3つと seed がエラーなしで当たった。Studio の代わりに `psql` で、`profiles` にサンプル用のユーザー（表示名「サンプル」）、レシピノート1件（決まった招待トークン）、オーナーの所属1件、レシピ3件を確かめた。あわせて、未ログインの公開可能キーでは `recipes` が空（RLS）で、招待トークンの RPC はレシピノートを返すことを確かめた

## 2. ローカルプレビューの削除と、接続設定がないときの画面

- [x] 2.1 `src/lib/supabase.ts` に `getSupabase` を足し、`recipes.ts` と `groups.ts` の localStorage への分岐を `getSupabase()` を使う形に置き換える（design の決定2）。`npm run build` が通ることを確かめる
- [x] 2.2 `AppContext.tsx` と `app-context.ts` から、localStorage への分岐、`bootLocal`、`signInLocal`、`isDemoMode`、`localGetProfileName` を削除する。接続設定がないときは、利用者なしで `authReady` を `true` にする（design の決定1、2）。`npm run build` が通ることを確かめる
  - 確認結果: 2.2 だけでは画面側が `isDemoMode` と `signInLocal` を使っていて型エラーになるため、2.3 と合わせて `npm run build` が通ることを確かめた
- [x] 2.3 `LoginPage.tsx` のメール入力のフォーム、`SettingsPage.tsx` の保存先の案内、`AppShell.tsx` の「ローカルプレビュー中」の表示を削除する（design の決定2）。`npm run build` が通ることを確かめる
- [x] 2.4 `src/pages/SupabaseSetupPage.tsx` を作り、`App.tsx` で、接続設定がなくデモモードでもないときは、どの URL でもこの画面を表示する（design の決定1）。`.env.local` の値を空にして起動し、`/`、`/login`、`/recipes` でこの画面が出ること、「デモのレシピを見る」でデモが始まること、`/recipes?demo=1` を直接開くとデモになることを確かめる
- [x] 2.5 `src/lib/localStorage.ts` を削除し、`grep -rn "localStorage\|isDemoMode\|signInLocal\|ローカルプレビュー" src` の結果に、デモモードの sessionStorage の処理以外が残っていないことを確かめる

## 3. 文書と設定

- [x] 3.1 `README.md` の手元の確認と Google ログインの設定の章、`.env.example` を、Supabase Local を使う形に書き換える（design の決定6）。README の手順のとおりに、`npm run db:start` から Google ログインとサンプルのレシピノートへの参加まで進められることを、1.5 と 4.3 の確認で確かめる
- [x] 3.2 `AGENTS.md` の `src/lib/` の説明、コマンドの章、確認の章を書き換える（design の決定6）。ローカルプレビューと localStorage の記述が残っていないことを `grep` で確かめる
- [x] 3.3 `openspec/config.yaml` の `context` と `rules` を、2つの動作モードと seed の扱いに書き換える（design の決定6）。`openspec validate replace-local-preview-with-supabase-local --strict` が通ることを確かめる

## 4. 確認

- [x] 4.1 `npm run lint` と `npm run build` がエラーなしで通ることを確かめる
- [x] 4.2 接続設定なし（`.env.local` の値が空）で、知らせる画面が出て、そこからデモを開けることを確かめる
  - 確認結果: 接続設定を空にした開発サーバーを、Chrome のヘッドレスモード（`--dump-dom`）で描画して確かめた。`/`、`/login`、`/recipes`、`/settings` で「接続設定がありません」の画面と3つの手順が表示され、`/recipes?demo=1` ではデモの一覧が表示された。画面の「デモのレシピを見る」は `/recipes?demo=1` へのリンクであることを確かめたが、クリックの操作そのものは行っていない
- [x] 4.3 Supabase Local で、Google ログイン、招待リンクからサンプルのレシピノートへの参加、レシピの一覧・検索・詳細・追加・編集・並び替え・削除、設定画面のメンバー（サンプルと自分）と招待リンク、ログアウトを確かめる。`npm run db:reset` の後に、同じ手順でもう一度参加できることも確かめる
- [x] 4.4 デモモードで、一覧、詳細、編集、設定の画面と、保存できないことを確かめる
  - 確認結果: 接続設定なしの開発サーバーで、Chrome のヘッドレスモードで描画して確かめた。デモの一覧（3件）、設定画面（「デモモード」の表示、固定データの案内、メンバー3人）、詳細画面（削除の操作が表示されない）、編集画面（「変更を保存」が2つとも無効、デモモードの案内）
- [ ] 4.5 この変更の PR の Vercel のプレビューのデプロイが成功する（`devDependencies` の Supabase CLI の取得でビルドが止まらない）ことと、プレビューで本番の Supabase につながり Google ログインできることを確かめる

## Workflow follow-up

- PR を作り、知らせる画面とログイン画面（メール入力のフォームがなくなったこと）のスクリーンショットを添付する
- マージの前に `archive` ラベルを付けて、この変更をアーカイブし、`app-modes` と `auth` の仕様に変更を反映する
- アーカイブの後、`openspec/specs/app-modes/spec.md` の Purpose の「ローカルプレビュー」を直接直す
- マージの後、手元の `.env.local` を Supabase Local の値に書き換え、本番の値を手元から消す
