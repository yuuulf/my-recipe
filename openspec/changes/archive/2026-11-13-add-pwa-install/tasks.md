# Tasks

## 1. アイコン

- [x] 1.1 利用者から、ロゴの元画像（512px 以上の PNG、または SVG）を受け取り、`public/logo-source.png`（SVG なら `.svg`）に置く。画像の大きさと形（角丸の四角の中か、四角いっぱいか）を確かめる
  - 確認結果: `~/Downloads/logo.png` を受け取り、`public/logo-source.png` に置いた。2000×2000px の PNG で、四角いっぱいの緑の背景に、白の泡立て器とフライ返しが描かれている（角丸なし）
- [x] 1.2 `@vite-pwa/assets-generator` を開発用の依存に足し、`pwa-assets.config.ts` と `generate-pwa-assets` のスクリプトを作って、アイコンを生成する（design の決定4）。マスク可能なアイコンが Android の丸い形で欠けないことを、画像を丸く切り抜いて確かめる。`index.html` のアイコンのリンクを置き換え、古いアイコンと `public/icons.svg` を消す。`npm run build` が通ることを確かめる
  - 確認結果: 元画像の背景は `#347859`（`--color-primary` と同じ）だった。`minimal-2023` のプリセットで、ふつうのアイコンは余白なし、apple-touch-icon は余白なしで背景を緑、マスク可能なアイコンは余白 0.3 で背景を緑にして生成した（フライ返しの右上の角が中心から元画像の約56%の距離にあるため、70%に縮めて安全な円の中に入れた）。マスク可能なアイコンを直径80%の円で切り抜いた画像で、泡立て器とフライ返しが欠けないことを確かめた。`index.html` のリンクを `favicon.ico` と `apple-touch-icon-180x180.png` に置き換え、`favicon-16.png`、`favicon-32.png`、`apple-touch-icon.png`、`icons.svg` を消した。`pwa-assets.config.ts` を `tsconfig.node.json` の型チェックの対象に足した。`npm run build`、`npm run lint`、`npm test` が通った

## 2. PWA

- [x] 2.1 `vite-plugin-pwa` を開発用の依存に足し、`vite.config.ts` にマニフェストと Workbox の設定、`src/main.tsx` に登録、`tsconfig.app.json` に型を足す（design の決定1〜3）。`npm run build` で `dist/` に `manifest.webmanifest` と `sw.js` ができ、`npm run dev` では Service Worker が登録されないことを確かめる。`npm test` が通ることを確かめる
  - 確認結果: `npm run build` で `dist/` に `manifest.webmanifest`、`sw.js`、`workbox-*.js` ができた。端末に置くファイルは12件（約772KB、うちアプリの JS が約698KB）で、元画像 `logo-source.png` は入っていない。マニフェストの名前・色・アイコンが設定どおりで、`index.html` にマニフェストのリンクが入る。マニフェストとアイコンが二重に入っていたため、プラグインの自動の追加とファイルの一覧が重ならないように直した。開発サーバーでは、登録の処理が何もしない版に置き換わり、Service Worker の登録が0件、マニフェストのリンクもないことを確かめた。`npm test`（77件）、`npm run lint` が通った
- [x] 2.2 `index.html` にテーマの色と iPhone 向けのメタ情報を足し、`vercel.json` に Service Worker とマニフェストのキャッシュの設定を足す（design の決定5）。`npm run build` が通り、`vercel.json` が JSON として正しいことを確かめる
  - 確認結果: `index.html` に `theme-color`（`#ffffff`）、`mobile-web-app-capable`、`apple-mobile-web-app-title`（My Recipe）を足した。`vercel.json` に、`/sw.js` と `/manifest.webmanifest` を `Cache-Control: public, max-age=0, must-revalidate` で返す設定を足し、JSON として読めることを確かめた。登録の処理はアプリの JS に入るので `registerSW.js` は作られず、design の記述も直した。`npm run build` が通った

## 3. 確認

- [x] 3.1 `npm run lint`、`npm run build`、`npm test`、`npm run db:test` がエラーなしで通ることを確かめる
  - 確認結果: `npm run lint`、`npm run build`、`npm test`（77件）が通った。`npm run db:test` は、Supabase Local のコンテナが止まっていて最初は接続できなかったため、`npm run db:start` で起動し直してから87件すべて通った
- [x] 3.2 `npm run preview` の画面を、ヘッドレスの Chrome で開き、マニフェストの中身と、インストールの条件を満たしている（インストールできない理由がない）ことを確かめる。Supabase Local につないだ状態で、ログインしてレシピを開けること、デモを開けることを確かめる
  - 確認結果: 自動で確かめた（利用者と相談して決定）。`npm run preview`（ポート4173、Supabase Local につなぐビルド）を、ヘッドレスの Chrome の DevTools Protocol で操作した。`Page.getAppManifest` でマニフェストにエラーがなく、名前「My Recipe」、standalone、`/`、テーマ色 `#ffffff`、背景色 `#f5f7f6`、アイコン（64、192、512、マスク可能な512）が入っていた。Service Worker が有効になり、`Page.getInstallabilityErrors` でインストールできない理由は0件だった。テスト用のセッションでログインするとレシピ一覧と詳細が開き、`/recipes?demo=1` でデモの一覧が開いた
- [x] 3.3 `npm run preview` で、通信を切って開き直すと、アプリの画面が出て「レシピノートを読み込めませんでした」と「もう一度読み込む」が出ること、通信を戻して押すと一覧が出ることを確かめる。レシピのデータが Service Worker のキャッシュに入っていないことを確かめる
  - 確認結果: 自動で確かめた（利用者と相談して決定）。`npm run preview`（ポート4173、Supabase Local につなぐビルド）を、ヘッドレスの Chrome の DevTools Protocol で操作した。ログインしてレシピ一覧を開いた後、ページと Service Worker の両方の通信を切って開き直すと、アプリの画面が出て「レシピノートを読み込めませんでした」と「もう一度読み込む」が出た。通信を戻してボタンを押すと、レシピ一覧（10件）が出た。Service Worker のキャッシュはアプリのファイル12件だけで、Supabase の URL は0件、元画像も入っていなかった（最初の実行は、前の確認のデモの状態が残っていて正しく確かめられなかったため、ブラウザのデータを消してやり直した）
- [x] 3.4 `npm run preview` で、一度開いた後にアプリの文言を少し変えてビルドし直し、開き直すと新しい版に自動で入れ替わることを確かめる（確かめた後に文言は戻す）
  - 確認結果: 自動で確かめた（利用者と相談して決定）。`npm run preview`（ポート4173、Supabase Local につなぐビルド）を、ヘッドレスの Chrome の DevTools Protocol で操作した。最初は新しい版が「待機中」のまま有効にならず、読み直されなかった。プラグインは登録の処理を自分で入れるときだけ `skipWaiting` と `clientsClaim` を設定するため、`vite.config.ts` に明示した。直した後、元の版を開いてから、ログイン画面の見出しを一時的に変えてビルドし直し、開き直すと、3〜6秒で新しい版が有効になり、画面が1回だけ読み直されて新しい見出しが出た。確かめた後に見出しは元に戻した
- [x] 3.5 （利用者）Vercel のプレビューの環境で、iPhone の Safari からホーム画面に追加し、アドレスバーなしで開くこと、Google でログインできること、Android の Chrome でインストールしてアイコンが欠けないことを確かめる。プレビューは Supabase につながらないので、ログインは本番へのマージの後に確かめてもよい
  - 途中経過: 利用者が、このブランチの Vercel のプレビューで、iPhone の Safari からホーム画面に追加できること、アドレスバーなしで開くことを確かめた。Android の Chrome でのインストールとアイコンの形、アプリからの Google ログイン（プレビューは Supabase につながらないため）は、マージの後に本番で確かめる
  - 確認結果: マージの後、利用者が Android の Chrome でインストールでき、アイコンが欠けないこと、本番の iPhone のホーム画面のアプリから Google でログインできることを確かめた

## Workflow follow-up

- PR を作り、マニフェストの中身、アイコン、インストールの確認の結果を載せる。画面の見た目は変わらないので、画面のスクリーンショットの代わりにアイコンの画像を載せる
- マージの前に `archive` ラベルを付けて、この変更をアーカイブし、`app-install` の仕様を作る
- マージの後、本番で iPhone のホーム画面のアプリからのログインと、新しい版への自動の更新を確かめる
