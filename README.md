# My Recipe

家族や友人と一緒に使える、料理レシピ管理Webアプリです。React + TypeScript + Vite をフロントエンドに採用し、Supabase接続時はAuth・PostgreSQL・RLS・RPCを利用します。

## ローカルで確認する

```bash
npm install
npm run dev
```

Supabaseの環境変数がない場合はローカルプレビューモードで起動します。サンプルレシピの閲覧、検索、登録、編集、削除、招待リンクの画面を確認できます。データはブラウザのlocalStorageに保存されます。

## Supabaseを接続する

`.env.local` を作成し、以下を設定します。

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Supabase SQL EditorまたはSupabase CLIで [`supabase/migrations/20260928000000_initial_schema.sql`](supabase/migrations/20260928000000_initial_schema.sql) を実行してください。Magic Link認証のRedirect URLには、開発URL（例：`http://localhost:5173/recipes`）と本番URLを登録します。

## デモ

ログイン画面の「デモのレシピを見る」から、Supabaseの認証状態に依存しない固定データのデモを開けます。デモユーザーのメールアドレスは `demonstration@example.com` です。

デモではレシピの追加・編集画面を表示できますが、「レシピを保存」「変更を保存」は無効です。削除操作は表示せず、グループ設定とメンバー情報も固定表示で、メンバー招待リンクはログイン画面を指します。

## コマンド

```bash
npm run build
npm run lint
```
