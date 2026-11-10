# Tasks

## 1. 準備

- [x] 1.1 （利用者の作業）OpenRouter のアカウントと API キーを作り、構造化出力に対応し、送った文章の扱いに問題がない無料のモデル（ID が `:free` で終わるもの）を選ぶ。選んだモデルの ID を伝える
  - 決定: `openrouter/free`（OpenRouter の Free Models Router）。OpenRouter の公開のモデル一覧で、料金が0で、`structured_outputs` と `response_format` に対応していることを確かめた。要求ごとに無料のモデルの中から選ばれるため、使われるモデルとその提供元のデータの扱いは要求ごとに変わりうる（利用者が了承して選んだ）
- [x] 1.2 `supabase/functions/.env.example`（`OPENROUTER_API_KEY=`、`OPENROUTER_MODEL=`）を足し、`supabase/config.toml` に `[functions.recipe-draft]`（`verify_jwt = true`）を足す。`git check-ignore supabase/functions/.env` で、シークレットのファイルが Git の管理外であることを確かめる
- [x] 1.3 （利用者の作業）`supabase/functions/.env` に API キーと 1.1 で選んだモデルの ID を書く

## 2. Edge Function

- [x] 2.1 `supabase/functions/recipe-draft/index.ts` に、文章の確認（空、8,000文字）、利用者と所属の確認、シークレットの確認を書く（design の決定1）。`npm run db:start` の後、`curl` でトークンなし（401）、所属のないユーザー（403）、空の文章（400）、長すぎる文章（400）、シークレットなし（503）の応答を確かめる。Edge Function の中で使える Supabase の環境変数の名前もここで確かめる
  - 確認結果: トークンなしはゲートウェイ（`verify_jwt`）が 401（`UNAUTHORIZED_NO_AUTH_HEADER`、Edge Function の JSON の形ではない）、所属のないユーザーは 403 `no_group`、空と8,001文字は 400 `invalid_input`、8,000文字はシークレットなしで 503 `not_configured`、CORS のプリフライトは 200。Edge Function の中では `SUPABASE_URL` と `SUPABASE_ANON_KEY` が使える。テスト用のトークンは開発用の JWT の鍵とテスト用のセッションで作った。あわせて、`seed.sql` のサンプル用のユーザーのトークンの列が NULL だと Auth が読めず 500 になるため、空の文字列を入れるよう直した
- [x] 2.2 OpenRouter の呼び出し（`json_schema`、`require_parameters`、60秒で打ち切り）と、zod での検証と整形を書く（design の決定2、3）。サンプルのレシピノートのメンバーのトークンで、レシピの文章を送ると 200 で下書きが返り、レシピでない文章では 422 が返ることを `curl` で確かめる
  - 確認結果: `openrouter/free` で、肉じゃがのレシピの文章を送ると約14秒で 200 が返り、料理名、説明、材料9行、作り方4行、タグ、調理時間40、人数4、参考URL、メモがそろった下書きになった。レシピでない文章では 422 `unreadable` が返った。zod の検証と整形は、実際のファイルから切り出して Node.js でも確かめた（項目の欠け、型の違い、JSON でない応答、`javascript:` の URL、小数や負の数）

## 3. 画面

- [x] 3.1 `src/features/recipes/api/` に Edge Function を呼ぶ処理と、エラーの `code` を受け取る処理を書く。`npm run build` が通ることを確かめる
- [x] 3.2 `RecipeDraftAssist.tsx` を作り、`RecipeForm` に `draftAssist` を足して追加画面だけで表示する（design の決定4）。開閉、文字数の表示、送る前の確認、読み込み中、エラーの表示、入力済みのときの置き換えの確認、デモモードでの無効化を入れる。`npm run build` が通ることを確かめる

## 4. プライバシーポリシーと文書

- [x] 4.1 `PrivacyPolicyPage.tsx` に、AI の下書きのために入力された文章と、それが外部の AI サービスに送られることを書き足し、最終更新日を更新する（design の決定5）。画面を目で見て確かめる
- [x] 4.2 README（OpenRouter のキーとモデル、手元の `supabase/functions/.env`、本番の `supabase secrets set` と `supabase functions deploy`）と AGENTS.md を書き足す。README の手順のとおりに手元で下書きを作れることを、5.2 の確認で確かめる

## 5. 確認

- [x] 5.1 `npm run lint` と `npm run build` がエラーなしで通ることを確かめる
- [x] 5.2 Supabase Local で、追加画面から次を確かめる: レシピの文章から下書きがフォームに入り保存できる、読み取れなかった項目は空のまま、入力済みのときは置き換えの確認が出て「やめる」でフォームが変わらない、空と8,000文字を超える文章は送られない、レシピでない文章で「読み取れませんでした」が出る、下書きを入れた後にページを離れようとすると確認が出る、編集画面には欄が出ない
  - 確認結果: 利用者が Supabase Local で確かめた。レシピでない文章でも「手順」や「用意するもの」があると、それが材料や作り方として読み取られて下書きになり、明らかに違う文章では「レシピを読み取れませんでした」になった。下書きは保存されず利用者が確かめてから保存するため、いまの動き（料理名・材料・作り方のどれかがあれば下書きにする）のままにする（利用者と相談して決定。AI にレシピかどうかを判定させる案と、条件を厳しくする案は採らない）
- [x] 5.3 デモモードで、追加画面の下書きのボタンが無効で、デモモードの案内が出ることを確かめる
  - 確認結果: 自動で確かめた（利用者と相談して決定）。接続設定なしの開発サーバーで、Chrome のヘッドレスモードを DevTools Protocol で操作し、デモモードの追加画面で欄を開くと、テキストエリアと「AIで下書きを作る」が無効で、「デモモードではAIの下書きは使えません。」が表示されることを確かめた
- [x] 5.4 ブラウザの開発ツールで、配られる JavaScript と Edge Function への通信に OpenRouter の API キーが含まれないことを確かめる
  - 確認結果: 開発ツールの代わりに自動で確かめた（利用者と相談して決定）。`supabase/functions/.env` の API キーの値（表示せずに読んだ）が、ビルド結果の `dist/`、`src/`、Git が管理するファイルのどれにも含まれないこと、`dist/` に `OPENROUTER` や `openrouter.ai` の文字がないことを確かめた。ブラウザは文章だけを `recipe-draft` に送り、OpenRouter を呼ぶのは Edge Function だけ

## Workflow follow-up

- PR を作り、追加画面の下書きの欄（閉じた状態、開いた状態、エラー、置き換えの確認）のスクリーンショットを添付する
- （利用者の作業）本番の Supabase に `supabase secrets set OPENROUTER_API_KEY=... OPENROUTER_MODEL=...` でシークレットを設定し、`supabase functions deploy recipe-draft` で Edge Function をデプロイする（マージの前でもよい）
- マージの前に `archive` ラベルを付けて、この変更をアーカイブし、`recipe-draft-assist` の仕様を作る
- マージの後、本番の追加画面で下書きを作れることを確かめる
