# Design

## Context

なぜ入れるかは proposal.md、求める動作は `specs/app-install/spec.md` を参照。いまの状態:

- `index.html` に favicon（16px、32px）と apple-touch-icon（180px）がある。マニフェスト、テーマの色、Service Worker はない
- 手元のロゴ画像は最大 180px で、512px のアイコンを作るには小さい。`public/icons.svg` は Vite のひな形の残りで、どこからも使われていない
- 本番は Vercel で、`vercel.json` はすべてのパスを `index.html` に書き換えている（静的ファイルがあればそちらが先に返る）
- ログインは Supabase の Google OAuth で、ログインの後は `/login` に戻る。データはすべて Supabase（別のオリジン）から読む
- ビルドは Vite 8

## Goals / Non-Goals

**Goals:**

- iPhone、Android、PC のブラウザから、アプリとして追加できる（各ブラウザのインストールの条件を満たす）
- アプリの画面のファイルだけを端末に置き、データは置かない
- 新しい版を自動で取り込む。ただし、使っている途中で画面が読み直されることは、できるだけ避ける

**Non-Goals:**

- 通信がないときのレシピの表示、プッシュ通知、インストールを促す画面（proposal の対象外）
- アプリの画面の見た目の変更（アイコンの元画像は差し替えるが、画面のロゴ `src/assets/logo.png` は変えない）

## Decisions

### 1. vite-plugin-pwa でマニフェストと Service Worker を作る

`vite-plugin-pwa` を開発用の依存に足し、`vite.config.ts` に設定する。Service Worker は、ビルドのファイルの一覧から Workbox で作る（`generateSW`）。手で Service Worker を書く案は、ファイルの一覧や版の管理を自分で持つことになるので採らない。

- **登録**: `src/main.tsx` で `virtual:pwa-register` の `registerSW({ immediate: true })` を呼ぶ。型は `vite-plugin-pwa/client` を `tsconfig.app.json` の `types` に足す
- **開発中**: `devOptions.enabled` は `false`（既定）にし、Service Worker は本番のビルドと `npm run preview` でだけ動かす。開発中の画面が古いまま残らないように
- **端末に置くファイル**: `globPatterns` を `**/*.{js,css,html,png,svg,ico,webmanifest}` にする。ページの移動（`navigate` の要求）には `index.html` を返す（`navigateFallback`）。Supabase など別のオリジンへの要求は、置かずにそのまま通す（`runtimeCaching` は設定しない）
- **通信がないとき**: アプリの画面は端末のファイルで表示される。Supabase への要求は失敗し、いまの「レシピノートを読み込めませんでした」と「もう一度読み込む」が出る（新しい画面は作らない）

### 2. 更新は自動（registerType: 'autoUpdate'）

利用者の判断で、新しい版は自動で取り込む。`registerType: 'autoUpdate'` にし、Workbox の `skipWaiting` と `clientsClaim` を `true` にして、新しい Service Worker が待たずに有効になり、画面が読み直されるようにする（登録の処理を `src/main.tsx` に書くため、プラグインはこの2つを自動では設定しない。実装の確認で分かった）。

- 使っている途中の読み直しを減らすため、更新の確認は、ブラウザが既定で行うもの（アプリを開いたとき、およびページの移動のとき）だけにする。タブに戻ったときや一定時間ごとに確認する処理は足さない。そのため、読み直しはほとんどがアプリを開いた直後に起き、入力の途中で起きることは少ない
- iPhone のホーム画面のアプリは、裏から戻っただけでは開き直さないので、新しい版はアプリを完全に閉じて開き直したときに入る。すぐに確かめたいときは、アプリを閉じて開き直す

### 3. マニフェスト

| 項目 | 値 |
|---|---|
| `name` / `short_name` | My Recipe |
| `description` | 家族や友人と一緒に使える、私のレシピノート。（`index.html` の説明と同じ） |
| `lang` | ja |
| `start_url` / `scope` | `/` |
| `display` | standalone |
| `theme_color` | `#ffffff`（ヘッダーの面の色 `--color-surface` と同じ。ステータスバーがヘッダーとつながって見えるように） |
| `background_color` | `#f5f7f6`（画面の背景 `--color-background` と同じ。起動の画面の色） |
| `icons` | 64px、192px、512px、マスク可能な 512px |

色は `src/index.css` のトークンと同じ値を書く（マニフェストでは CSS の変数を使えないため）。トークンを変えたときは、ここも合わせる。

### 4. アイコンは元画像から生成する

利用者が用意するロゴの元画像（512px 以上の PNG、または SVG）を `public/logo-source.png`（SVG なら `.svg`）に置き、`@vite-pwa/assets-generator` の `minimal-2023` のプリセットで各サイズを作る。設定は `pwa-assets.config.ts` に書き、`package.json` に `"generate-pwa-assets": "pwa-assets-generator"` を足す。生成した画像はリポジトリに入れる（ビルドのたびには作らない）。

- 作るもの: `favicon.ico`、`pwa-64x64.png`、`pwa-192x192.png`、`pwa-512x512.png`、`maskable-icon-512x512.png`、`apple-touch-icon-180x180.png`
- マスク可能なアイコンは、ロゴを縮めて余白をとり、背景をロゴの緑（`--color-primary`、`#347859`）で塗る。Android で丸などに切り取られても、ロゴが欠けないように
- `index.html` の favicon と apple-touch-icon のリンクを、生成したファイルに置き換え、いまの `favicon-16.png`、`favicon-32.png`、`apple-touch-icon.png` は消す
- 使われていない `public/icons.svg` を消す

元画像の形（角丸の四角の中にロゴがあるか、四角いっぱいの絵か）によって、マスク可能なアイコンの余白の量を変える。実装のときに生成した画像を見て、余白を決める。

### 5. index.html と Vercel

- `index.html` に `<meta name="theme-color" content="#ffffff">`、`<meta name="apple-mobile-web-app-title" content="My Recipe">`、`<meta name="mobile-web-app-capable" content="yes">` を足す。マニフェストへのリンクは、プラグインが入れる
- `vercel.json` に、`/sw.js` と `/manifest.webmanifest` を `Cache-Control: public, max-age=0, must-revalidate` で返す設定を足す。古い Service Worker がブラウザに残り、更新が届かないことを防ぐため。登録の処理は `src/main.tsx` からアプリの JS に入る（`injectRegister: false`）ので、`registerSW.js` は作られない。`/assets/` のファイル名には中身のハッシュが付くので、いまのままでよい

### 6. 確かめ方

- **自動**: `npm run build` と `npm run preview` で、ヘッドレスの Chrome（DevTools Protocol）を使う
  - `Page.getAppManifest` でマニフェストの中身を確かめる
  - `Page.getInstallabilityErrors` で、インストールの条件を満たしていることを確かめる
  - 通信を切って開き直し、アプリの画面が出て「読み込めませんでした」が出ることを確かめる
  - 2回ビルドして、新しい版が自動で入ることを確かめる
- **手動（利用者）**: 本番またはプレビューの環境で確かめる
  - iPhone の Safari でホーム画面に追加し、アドレスバーなしで開くこと、Google でログインできること
  - Android の Chrome でインストールし、アイコンが欠けないこと

## Risks / Trade-offs

- [Risk] iPhone のホーム画面のアプリで Google でログインすると、ログインの画面がアプリの外（Safari の画面）で開き、ログインの結果がアプリに戻らないことがある → 手動の確認で必ず試す。戻らない場合は、ログインの戻り先の扱いを別の変更で直す（この変更では、アプリとして開いた状態からログインする手順を確かめるところまで）
- [Risk] 自動の更新で、まれに入力の途中で画面が読み直される → 更新の確認をアプリを開いたときに限り、起きにくくする。利用者の判断で自動を選んだ
- [Risk] Service Worker の不具合で古い画面が残り続ける → `vercel.json` で Service Worker のファイルをキャッシュさせない。最悪のときは、ブラウザのサイトのデータの削除で消せる
- [Trade-off] 新しい依存（`vite-plugin-pwa`、`@vite-pwa/assets-generator`）が増える → どちらも開発用で、ブラウザに送るのは Workbox の小さな登録の処理だけ

## Migration Plan

1. マージすると Vercel が新しい版をデプロイし、初めて開いたときに Service Worker が入る。データやマイグレーションの作業はない
2. 戻すときは、プラグインを外したうえで、すでに入った Service Worker を消す処理（`selfDestroying: true` の設定で1回デプロイする）を入れてから外す。単にプラグインを外すだけでは、端末に古い Service Worker が残る
