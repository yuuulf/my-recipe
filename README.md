# My Recipe

家族や友人と一緒に使える、料理レシピ管理Webアプリです。React + TypeScript + Vite をフロントエンドに採用し、Supabase接続時はAuth・PostgreSQL・RLS・RPCを利用します。

## ローカルで確認する

手元では、本番と同じスキーマのSupabaseをDockerで動かすSupabase Localを使います。本番のSupabaseには手元からつなぎません。

### 1. 準備

Node.jsはmiseで管理します。miseをインストールしたうえで、`mise.toml`で指定したNode.js 22を使用してください。Dockerの実行環境にはOrbStackを使います。

```bash
brew install orbstack   # 起動して docker version が通ることを確認する
mise install
mise exec -- npm ci     # Supabase CLI も開発用の依存として入る
```

シェルでmiseを有効化している場合は、`mise exec --`を省略できます。

### 2. Googleログインの設定（初回のみ）

手元でも本番と同じGoogleログインを使います。

1. Google Cloud ConsoleのOAuthクライアント（本番と同じもの）の承認済みのリダイレクトURIに、`http://127.0.0.1:54321/auth/v1/callback` を追加します。
2. `supabase/.env` を作成し、OAuthクライアントのIDとシークレットを書きます。このファイルはGitの管理外です。

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-client-secret
```

### 3. Supabase Localを起動する

```bash
npm run db:start    # 初回はイメージの取得に時間がかかる。マイグレーションとサンプルデータが当たる
npm run db:status   # API_URL、PUBLISHABLE_KEY、STUDIO_URL などを表示する
```

`.env.local` を作成し、`npm run db:status` に表示された `API_URL` と `PUBLISHABLE_KEY` の値を書きます（[`.env.example`](.env.example) を参照）。`STUDIO_URL`（ポート54323）や `SECRET_KEY` と取り違えないでください。`SECRET_KEY` は秘密のキーなので、`VITE_` で始まる変数には入れません。本番の接続先は `.env.local` に書かず、Vercelの環境変数にだけ置きます。

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321          # API_URL
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... # PUBLISHABLE_KEY
```

### 4. アプリを起動する

```bash
npm run dev
```

`http://localhost:5173` を開き、Googleでログインします。接続設定がない場合は、設定の手順を案内する画面が表示されます（デモは見られます）。

### 5. サンプルのレシピノートに参加する

Supabase Localには、サンプルのレシピノートが2つ入っています。ログインした後、次の招待リンクを開いて参加してください。参加した後は、ヘッダーのレシピノートの名前から切り替えられます。

```
http://localhost:5173/join/00000000-0000-4000-8000-000000000101
http://localhost:5173/join/00000000-0000-4000-8000-000000000301
```

| レシピノート | オーナー | メンバー | レシピ |
|---|---|---|---|
| サンプルのレシピノート | サンプル | サンプル、ゆき | 10件 |
| ゆきのノート | ゆき | ゆき、サンプル | 1件 |

サンプル、ゆき、けんたはログインできない利用者です。けんたはどのレシピノートのメンバーでもありません。次のことを確かめられます。

- 登録者の名前: 「だし巻き卵」は「ゆき」、「具だくさん豚汁」（けんたが登録）は「メンバー」と表示される
- レシピノートの切り替え: サンプルのレシピノートを開いた状態で `/recipes/00000000-0000-4000-8000-0000000000a5` を開くと、ゆきのノートの「チキンカレー」に切り替わる
- 検索の記号: `%` では「カカオ70%のガトーショコラ」だけ、`_` ではタグに `作り置き_冷凍OK` がある「ひじきの煮物」だけが出る
- 検索の大文字と小文字: `blt` でも「BLTサンド」が出る
- 検索の対象外: 「湯せん」はガトーショコラの作り方にしかないため、検索しても出ない
- 並び順: レシピの更新日時をずらしてあり、一覧は「BLTサンド」から新しい順に並ぶ
- 値のない項目: 「ゆで卵」は料理名、材料、作り方だけで、ほかの欄は詳細画面に出ない
- 参考URL: 「だし巻き卵」の参考URLは新しいタブで開く
- 入力の上限: 「上限いっぱいの料理名（100文字）…」（`/recipes/00000000-0000-4000-8000-0000000000a6`）は、すべての項目が上限ちょうど（料理名100文字、説明500文字、材料50行・1行100文字、作り方50行・1行500文字、タグ10個・1つ20文字、調理時間4,320分、人数100人分、参考URL2,000文字、メモ2,000文字）。長い文章や行の多い表示と、編集画面でそのまま保存できることを確かめられる
- オーナーだけの操作: 自分はどちらのレシピノートのオーナーでもないため、名前の変更はできない（自分でレシピノートを作ると試せる）

### Supabase Localのコマンド

| コマンド | 内容 |
|---|---|
| `npm run db:start` | 起動する |
| `npm run db:stop` | 停止する |
| `npm run db:reset` | データベースを作り直し、マイグレーションとサンプルデータ（[`supabase/seed.sql`](supabase/seed.sql)）を当て直す |
| `npm run db:status` | `API_URL`、`PUBLISHABLE_KEY`、Supabase Studioの `STUDIO_URL` などを表示する |
| `npm run db:test` | [`supabase/tests/`](supabase/tests/) のデータベースのテスト（pgTAP）を実行する。RLS、RPC、検索の関数、入力の上限を確かめる |

スキーマを変えるときは、[`supabase/migrations/`](supabase/migrations/) にタイムスタンプ付きのSQLを追加し、`npm run db:reset` でマイグレーションとサンプルデータが当たることを確認します。本番には、Supabase SQL EditorまたはSupabase CLIでマイグレーションを当てます。

## Googleログインを設定する

ログインはGoogleアカウントのみです。この章は本番のSupabaseの設定です。手元のSupabase Localの設定は「ローカルで確認する」を参照してください。

### 1. Google Cloud

1. Google Cloud ConsoleでOAuth同意画面を作成し、スコープは基本的なもの（`openid`、`email`、`profile`）のみにします。
2. 確認の間は、同意画面の公開ステータスを「テスト」のままにし、確認に使うGoogleアカウントをテストユーザーに登録します。「テスト」のままだと、テストユーザーに登録した人しかログインできません。
3. 「OAuthクライアントID」を種類「ウェブアプリケーション」で作成し、承認済みのリダイレクトURIに `https://<プロジェクトID>.supabase.co/auth/v1/callback` を登録します。
4. 発行されたクライアントIDとクライアントシークレットを控えます。
5. アプリをデプロイした後、同意画面のブランディングに次のURLと承認済みドメインを設定し、公開ステータスを「本番環境」に切り替えます。URLはデプロイ後でないと開けないため、この手順はデプロイ直後に行います。
   - アプリのホームページ: `https://<本番のドメイン>/login`
   - プライバシーポリシー: `https://<本番のドメイン>/privacy`
   - 利用規約: `https://<本番のドメイン>/terms`
   - 承認済みドメイン: `<本番のドメイン>`

### 2. Supabase

1. Authentication → Sign In / Providers でGoogleを有効にし、Google CloudのクライアントIDとクライアントシークレットを設定します。
2. Authentication → URL Configuration の Redirect URLs に、本番の `/login**` を登録します。戻り先には `?returnTo=...` のクエリが付くため、末尾の `**` が必要です。`/login` の完全一致では、クエリ付きのURLが受け付けられません。手元のSupabase Localの戻り先は [`supabase/config.toml`](supabase/config.toml) で設定しています。
   - `https://<本番のドメイン>/login**`

Googleでの認証後は `/login` に戻り、ログイン画面が元の画面へ移動します。Redirect URLsに登録していないURLから始めた場合は、Site URLに戻されます。

### 3. Vercel

Vercelのプロジェクトの環境変数に、本番のSupabaseの `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` を設定します。service-roleキーは設定しないでください。

### 設定の順序

既存の利用者がログインできなくなる期間を作らないため、次の順序で進めます。

1. Google CloudでOAuthクライアントを作成する（同意画面は「テスト」とし、確認に使うアカウントをテストユーザーに登録する）
2. SupabaseでGoogleプロバイダーを有効にする（メールプロバイダーは有効のままにする）
3. SupabaseのRedirect URLsに本番の `/login**` を登録する
4. アプリをデプロイする（プライバシーポリシーと利用規約のページを含む）
5. デプロイ後すぐに、同意画面にホームページ、プライバシーポリシー、利用規約のURLと承認済みドメインを設定し、「本番環境」に切り替える。デプロイからこの手順までの間は、テストユーザー以外はログインできない
6. 既存の利用者と同じメールアドレスのGoogleアカウントでログインし、同じアカウントとグループが使われることを確認する
7. 確認後に、Supabaseのメールプロバイダーを無効にする

ロールバックするときは、Vercelで前のデプロイに戻します。メールプロバイダーを無効にした後であれば、再度有効にします。

## AIの下書きを設定する

レシピの追加画面の「文章から下書きを作る」は、貼り付けた文章から下書きを作り、フォームに入れる機能です。Supabase Edge Function（[`supabase/functions/recipe-draft/`](supabase/functions/recipe-draft/)）が OpenRouter を呼びます。OpenRouter のAPIキーはEdge Functionのシークレットにだけ置き、ブラウザには渡しません。設定がない場合、この機能は「下書きを作れませんでした」と表示し、ほかの機能は動きます。

### 1. OpenRouter

1. OpenRouter のアカウントを作り、APIキーを作成します。
2. 使うモデルを決めます。いまは無料のモデルの中から要求ごとに選ばれる `openrouter/free` を使っています。決まった形のJSONで返す機能（構造化出力）に対応していることが必要です。モデルによって、送った文章の扱い（記録や学習）が違う点に注意してください。
3. 無料のモデルは、1分20回、1日50回までです（クレジットを10以上買うと1日1,000回）。

### 2. 手元（Supabase Local）

[`supabase/functions/.env.example`](supabase/functions/.env.example) を `supabase/functions/.env` にコピーし、値を書きます。このファイルはGitの管理外です。

```env
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openrouter/free
```

書いた後は `npm run db:stop && npm run db:start` で起動し直します。Edge Functionは `supabase start` で一緒に動きます。

### 3. 本番

本番のSupabaseのプロジェクトに、シークレットを設定してEdge Functionをデプロイします。

```bash
npx supabase login
npx supabase link --project-ref <プロジェクトID>
npx supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key OPENROUTER_MODEL=openrouter/free
npx supabase functions deploy recipe-draft
```

モデルを替えるときは、`OPENROUTER_MODEL` を設定し直すだけで、デプロイし直す必要はありません。

## デモ

ログイン画面の「デモのレシピを見る」から、Supabaseに依存しない固定データのデモを開けます。接続設定がないときの案内の画面からも開けます。デモユーザーのメールアドレスは `demonstration@example.com` です。

デモではレシピの追加・編集画面を表示できますが、「レシピを保存」「変更を保存」と、追加画面のAIの下書きは無効です。削除操作は表示せず、グループ設定とメンバー情報も固定表示で、メンバー招待リンクはログイン画面を指します。

## コマンド

```bash
npm run build
npm run lint
npm test            # ロジックと画面の部品のテスト（Vitest）。Supabaseは不要
npm run db:start    # Supabase Local（ほかは「Supabase Localのコマンド」を参照）
npm run db:test     # データベースのテスト（pgTAP）。Supabase Localの起動が必要
```

PRを作ると、GitHub Actionsでlint、build、Vitestと、データベースのテストが実行されます。
