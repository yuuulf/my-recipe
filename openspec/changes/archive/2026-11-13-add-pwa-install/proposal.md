# Proposal

## Why

My Recipe はスマホで毎日使うことを前提にしているが、いまはブラウザで URL を開くしかなく、アドレスバーが画面を狭め、開くたびにブラウザのタブを探す必要がある。PWA としてホーム画面に追加できるようにし、アプリのように1タップで開けるようにする。

## What Changes

UI（ブラウザで表示する情報）と配信の変更。データ、API、ルーティング、アプリの画面は変えない。

- **インストール**: Web アプリマニフェストとアイコンを用意し、スマホ（iPhone の「ホーム画面に追加」、Android の「アプリをインストール」）と PC のブラウザから、アプリとして追加できるようにする。追加したアプリは、アドレスバーなしで開く
- **アイコン**: 192px、512px、マスク可能（Android で形が切り取られても欠けない）なアイコンを、利用者が用意する元の大きいロゴ画像から作る。いまの favicon と apple-touch-icon も同じ元画像から作り直す
- **Service Worker**: アプリの画面（HTML、JS、CSS、画像）を端末に置き、起動を速くする。レシピやログインのデータは置かず、いままでどおり毎回 Supabase から読む
- **更新**: 新しい版をデプロイしたら、インストールしたアプリは自動で新しい版に入れ替わり、画面を読み直す（利用者の判断）

対象外:

- 通信がないときにレシピを見られること（通信がないときは、いまの「読み込めませんでした」の表示になる）
- プッシュ通知、バックグラウンドの同期、共有の受け取り
- インストールを促すボタンやバナー（ブラウザの機能から追加する）

影響する動作モード:

- Supabase 接続: インストールでき、ログインしてレシピを使える
- デモ: インストールしたアプリからも、いままでどおりデモを開ける
- 手元の開発サーバー: Service Worker は本番のビルドでだけ動かし、開発中の画面が古いまま残らないようにする

## Capabilities

### New Capabilities

- `app-install`: アプリとしての追加、アプリとしての起動、画面の端末への保存、新しい版への更新

### Modified Capabilities

なし

## Impact

- 追加する開発用の依存: `vite-plugin-pwa`（マニフェストと Service Worker の生成）、`@vite-pwa/assets-generator`（元画像から各サイズのアイコンを作る）
- 追加: `public/` のアイコン（`pwa-192x192.png`、`pwa-512x512.png`、`maskable-icon-512x512.png` など）、アイコンの元画像、アイコンを作る設定（`pwa-assets.config.ts`）
- 変更: `vite.config.ts`（PWA の設定）、`index.html`（テーマの色、iPhone 向けのメタ情報）、`src/main.tsx`（Service Worker の登録）、`tsconfig.app.json`（登録の処理の型）、`package.json`（アイコンを作るスクリプト）、`public/favicon-*.png`、`public/apple-touch-icon.png`（作り直し）
- 削除: `public/icons.svg`（Vite のひな形の残りで、どこからも使われていない）
- Vercel の設定: Service Worker とマニフェストを最新に保つため、キャッシュの設定を足す
- データ、マイグレーション、Supabase の設定: 変更なし
