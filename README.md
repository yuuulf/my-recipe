# My Recipe

家族や友人と一緒に使える、料理レシピ管理Webアプリです。React + TypeScript + Vite をフロントエンドに採用し、Supabase接続時はAuth・PostgreSQL・RLS・RPCを利用します。

## ローカルで確認する

Node.jsはmiseで管理します。miseをインストールしたうえで、`mise.toml`で指定したNode.js 22を使用してください。

```bash
mise install
mise exec -- npm ci
mise exec -- npm run dev
```

シェルでmiseを有効化している場合は、`mise exec --`を省略できます。

Supabaseの環境変数がない場合はローカルプレビューモードで起動します。サンプルレシピの閲覧、検索、登録、編集、削除、招待リンクの画面を確認できます。データはブラウザのlocalStorageに保存されます。

## Supabaseを接続する

`.env.local` を作成し、以下を設定します。

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Supabase SQL EditorまたはSupabase CLIで、[`supabase/migrations/`](supabase/migrations/) のSQLをファイル名の順にすべて実行してください。

## Googleログインを設定する

Supabase接続時のログインはGoogleアカウントのみです。ローカルプレビューではGoogleログインを使わず、メールアドレスの入力だけでログインできます。

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
2. Authentication → URL Configuration の Redirect URLs に、本番と開発の `/login**` を登録します。戻り先には `?returnTo=...` のクエリが付くため、末尾の `**` が必要です。`/login` の完全一致では、クエリ付きのURLが受け付けられません。
   - `https://<本番のドメイン>/login**`
   - `http://localhost:5173/login**`

Googleでの認証後は `/login` に戻り、ログイン画面が元の画面へ移動します。Redirect URLsに登録していないURLから始めた場合は、Site URLに戻されます。

### 3. Vercel

Vercelのプロジェクトの環境変数に、`.env.local` と同じ `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` を設定します。service-roleキーは設定しないでください。

### 設定の順序

既存の利用者がログインできなくなる期間を作らないため、次の順序で進めます。

1. Google CloudでOAuthクライアントを作成する（同意画面は「テスト」とし、確認に使うアカウントをテストユーザーに登録する）
2. SupabaseでGoogleプロバイダーを有効にする（メールプロバイダーは有効のままにする）
3. SupabaseのRedirect URLsに本番と開発の `/login**` を登録する
4. アプリをデプロイする（プライバシーポリシーと利用規約のページを含む）
5. デプロイ後すぐに、同意画面にホームページ、プライバシーポリシー、利用規約のURLと承認済みドメインを設定し、「本番環境」に切り替える。デプロイからこの手順までの間は、テストユーザー以外はログインできない
6. 既存の利用者と同じメールアドレスのGoogleアカウントでログインし、同じアカウントとグループが使われることを確認する
7. 確認後に、Supabaseのメールプロバイダーを無効にする

ロールバックするときは、Vercelで前のデプロイに戻します。メールプロバイダーを無効にした後であれば、再度有効にします。

## デモ

ログイン画面の「デモのレシピを見る」から、Supabaseの認証状態に依存しない固定データのデモを開けます。デモユーザーのメールアドレスは `demonstration@example.com` です。

デモではレシピの追加・編集画面を表示できますが、「レシピを保存」「変更を保存」は無効です。削除操作は表示せず、グループ設定とメンバー情報も固定表示で、メンバー招待リンクはログイン画面を指します。

## コマンド

```bash
npm run build
npm run lint
```
