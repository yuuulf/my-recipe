# Tasks

各タスクの「独自クラスが残っていない」の確認は、対象ファイルの `className` に `App.css` 由来のクラス名が残っていないこと、そのクラスのルールが `App.css` から削除されていることを `grep` で確かめる。ブラウザでの見た目の比較は、5〜7章でまとめて行う。

## 1. 準備

- [x] 1.1 移行前の見た目の基準として、ローカルプレビューとデモで全画面のスクリーンショットを撮る。幅は 390px、800px、1280px の3つ。エラー表示、空の一覧、確認ダイアログ、デモとローカルプレビューの案内も含める。保存先と撮った画面の一覧を、この文書の検証記録に書く
- [x] 1.2 `tailwindcss` と `@tailwindcss/vite` を開発依存に追加し、`vite.config.ts` にプラグインを追加する。`npm ci` が通り、`package-lock.json` が更新されていることを確認する

## 2. テーマとベーススタイル

- [x] 2.1 `src/index.css` に `@import 'tailwindcss'` と `@theme` を追加する。design の Decision 2〜5、8 のとおり、色、影、角丸、文字サイズ、ブレークポイント、回転アニメーションを定義し、既定のパレット、文字サイズ、ブレークポイントを無効にする。`npm run build` が通り、生成されたCSSにテーマの変数が含まれることを確認する
- [x] 2.2 `src/index.css` の既存のリセットを `@layer base` に移し、プリフライトと重なるものを削除する。`App.css` はまだ残す。`npm run build` が通ることを確認する

## 3. 共通部品

- [x] 3.1 `Button` を `variant` ごとのクラスで書き換え、`button`、`button-*`、`button-spinner`、`full-width` のルールを `App.css` から削除する。呼び出し側で渡している `className` を確認し、競合するクラスがないことを確認する
- [x] 3.2 入力欄、ラベル、eyebrow、カードなど、複数の画面で使う部品のクラスを、`src/components/` のコンポーネントかクラス文字列の定数にまとめる（design の Decision 6）。`npm run build` が通ることを確認する
- [x] 3.3 `Loading` を書き換え、該当するルールを `App.css` から削除する。独自クラスが残っていないことを確認する
- [x] 3.4 `AppShell`（サイドバー、モバイルのヘッダーと下部ナビゲーション、`NavLink` の `active`）を書き換え、該当するルールを `App.css` から削除する。独自クラスが残っていないことを確認する
- [x] 3.5 `LegalPage` を書き換え、該当するルールを `App.css` から削除する。独自クラスが残っていないことを確認する

## 4. 画面

- [x] 4.1 `LoginPage` を書き換える。背景の円と区切り線の疑似要素も含む。該当するルールを `App.css` から削除し、独自クラスが残っていないことを確認する
- [x] 4.2 `SetupPage` を書き換え、該当するルールを `App.css` から削除する。独自クラスが残っていないことを確認する
- [x] 4.3 `JoinGroupPage` を書き換え、該当するルールを `App.css` から削除する。独自クラスが残っていないことを確認する
- [x] 4.4 `RecipeListPage` と `RecipeCard` を書き換える。検索欄、タグの `selected`、空の一覧、読み込み中も含む。該当するルールを `App.css` から削除し、独自クラスが残っていないことを確認する
- [x] 4.5 `RecipeDetailPage` を書き換える。手順をつなぐ線の疑似要素と削除の確認ダイアログも含む。該当するルールを `App.css` から削除し、独自クラスが残っていないことを確認する
- [x] 4.6 `RecipeForm`、`IngredientEditor`、`StepEditor`、`TagInput` と、`RecipeCreatePage`、`RecipeEditPage` を書き換える。必須項目の `*` と入力欄の `has-error` も含む。該当するルールを `App.css` から削除し、独自クラスが残っていないことを確認する
- [x] 4.7 `SettingsPage` を書き換える。役割の表示（owner / member）も含む。該当するルールを `App.css` から削除し、独自クラスが残っていないことを確認する
- [x] 4.8 `App.css` に残ったルールが使われていないことを `grep` で確認してから、`App.css` と `src/main.tsx` の読み込みを削除する。`className` に `[#` などの任意の色の値が残っていないことを `grep` で確認する。`npm run build` が通ることを確認する

## 5. ローカルプレビューモードの手動確認

- [x] 5.1 接続設定なしで起動する。1.1 と同じ画面、幅、状態でスクリーンショットを撮り、移行前と比べる。レイアウト、配色、表示される要素が変わっていないこと、ずれが1〜2px以内であることを確認して、結果を検証記録に書く
- [x] 5.2 761〜960px の幅で、サイドバーとモバイルナビゲーションの切り替えが移行前と同じ位置で起きることを確認する。ホバー、フォーカス、無効のボタン、読み込み中の回転も確認し、結果を検証記録に書く

## 6. デモモードの手動確認

- [x] 6.1 `demo=1` で起動する。1.1 と同じ画面でスクリーンショットを撮って移行前と比べ、デモの案内と無効のボタンの表示が変わっていないことを確認して、結果を検証記録に書く

## 7. Supabase接続モードの手動確認

- [x] 7.1 Supabase接続で起動し、ログイン画面（Googleログインのボタン）、招待画面、グループ設定画面が崩れていないことを確認して、結果を検証記録に書く

## 8. 全体の確認

- [x] 8.1 `npm run lint` を実行し、エラーがないことを確認する
- [x] 8.2 `npm run build` を実行し、成功することを確認する

## 検証記録

### タスク1.1（2026-11-09）

- 方法: 接続設定を空にしてViteの開発サーバーをローカルプレビューモードで起動した（`VITE_SUPABASE_URL= VITE_SUPABASE_PUBLISHABLE_KEY= npx vite --port 5199`）。puppeteer-core から手元のChrome（ヘッドレス）を動かし、ページ全体のスクリーンショットを撮った。puppeteer-core はセッションのスクラッチパッドに入れ、プロジェクトの依存関係には追加していない
- 撮影スクリプトは、id、aria-label、文言、placeholder だけで要素を選ぶ。移行後もクラス名に依存せず、同じスクリプトで撮れる
- 保存先: セッションのスクラッチパッドの `shots/before/`（`<画面>-<幅>.png`）。スクラッチパッドはセッションごとの一時領域なので、セッションが変わる場合は移行前のコミットで撮り直す
- 撮った画面（22画面・状態 × 3つの幅 = 66枚、失敗0）
  - ローカルプレビュー: ログイン（未ログイン）、セットアップ（未所属）、一覧、一覧（タグ「簡単」選択）、一覧（検索結果0件の空表示）、詳細、詳細（削除の確認ダイアログ）、登録、登録（料理名が空白のエラー）、編集、グループ設定、招待（未ログイン）、招待（ログイン済み）、招待（無効なトークン。既知の差異により中身が空）、プライバシーポリシー、利用規約
  - デモ: 一覧、詳細、登録（保存ボタンが無効）、編集、グループ設定、ログイン
- 目視で状態を確認した画像: 削除の確認ダイアログ（390px）、登録のエラー（1280px）、セットアップ（390px）、デモの登録（390px）、招待（未ログイン・800px）
- 撮影上の注意: ページ全体を撮るため、固定配置の要素（サイドバー、下部ナビゲーション、ダイアログの背景）は最初の画面の高さの位置にだけ描かれる。移行後も同じ条件で撮るため、比較には影響しない
- 撮らなかった表示: 読み込み中の表示（一瞬で終わるため）、ホバーとフォーカス（5.2で確認する）、Supabase接続モードだけの表示（7.1で確認する）

### タスク1.2（2026-11-09）

- `tailwindcss@^4.3.5` と `@tailwindcss/vite@^4.3.5` を開発依存に追加し、`vite.config.ts` のプラグインに `tailwindcss()` を追加した
- `npm ci` が成功した。`package-lock.json` に `node_modules/tailwindcss` と `node_modules/@tailwindcss/vite` が追加された
- 補足: `npm run build` も成功した。チャンクサイズの警告が出るが、この時点ではCSSにTailwindを読み込んでおらず、この変更とは関係しない

### タスク2.1（2026-11-09）

- `src/index.css` の先頭に `@import 'tailwindcss'` と `@theme` を追加した。既存のリセットはそのまま残している（2.2で移す）
- 定義したトークン
  - 色: `App.css` の `:root` の変数（互換用の別名を除く）、`info` / `info-soft`（旧 `--blue`）、`white`
  - 繰り返し使われる直書きの色（design の Decision 3 の 2）: `border-hover`（#b9c9be、ホバー時の枠線3か所）、`danger-hover`、`danger-text`、`danger-soft`（#fff5f2、5か所）
  - 1か所だけの色は、画面を書き換えるタスクで Decision 3 の手順に従って扱う。危険操作の枠線（#efcfc8、#e8b8ae、#dc8e7d）は、計算上 `danger/30`、`/45`、`/70` とほぼ同じ色になる。モーダルの背景は `text/38` と同じ色になる
  - 文字サイズ: `text-11` 〜 `text-30` の12段階。px の値をそのまま名前にした。行の高さは指定せず、これまでどおり親から継承する
  - 角丸: `sm` / `md` / `lg`（6 / 8 / 10px）
  - 影: `sm` / `md` に加え、主ボタンの影 `primary` / `primary-hover`
  - ブレークポイント: `sm` 641px、`md` 761px、`lg` 961px、`xl` 1200px
  - アニメーション: `animate-spin`（0.8秒に上書き）、`animate-spin-fast`（0.7秒）、`@keyframes spin`
  - フォント: `font-sans`（今のフォント指定）、`font-mono`
- 無効にした既定値: カラーパレット、文字サイズ、ブレークポイント
- `npm run build` が成功した
- 生成されたCSSの確認: Tailwindは使われたトークンの変数しか出力しない。そこでスクラッチパッドの確認用スクリプトから `@tailwindcss/node` の `compile` で `src/index.css` を直接コンパイルし、候補のクラスを渡して確かめた
  - 期待したユーティリティ: 50/50 が生成された（色、不透明度の修飾子、文字サイズ、角丸、影、4つのブレークポイント、アニメーション、フォント）
  - 無効にした既定値（`bg-red-500`、`text-gray-500`、`text-sm`、`text-base`、`text-xl`、`2xl:block`）: いずれも生成されなかった
  - メディアクエリ: `width >= 641px / 761px / 961px / 1200px` が生成された
- 既存のクラス名との衝突: ビルドしたCSSのユーティリティ層に、既存の `className` と同じ名前のクラスがないことを確かめた（衝突0件）
- 未確認: プリフライトが有効になったことによる、この時点の見た目の変化。比較は5〜7章で行う

### タスク2.2（2026-11-09）

- `src/index.css` の既存のリセットを `@layer base` に移した。色の直書きはテーマの変数（`--color-text`、`--color-background`、`--color-text-muted`、`--color-white`、`--color-primary`）に置き換えた
- `node_modules/tailwindcss/preflight.css` と照らし合わせ、プリフライトと重なるため削除したもの
  - `* { box-sizing: border-box }`、`body { margin: 0 }`
  - `button, input, textarea { font: inherit }`
  - `a { color: inherit }`（`text-decoration: none` は残した。プリフライトは `inherit` で、意味が違うため）
  - `:root` の `line-height: 1.5`、`font-family`（プリフライトが `--font-sans` から設定する）、`font-weight: 400`（ブラウザの既定値と同じ）
  - `button, a { -webkit-tap-highlight-color: transparent }`（プリフライトが `html` に設定し、子の要素に継承される）
  - プレースホルダーの `opacity: 1`
- 残したもの: `:root` の文字色・背景・文字の描画設定、`html` と `body` の最小幅・最小の高さ、`button` の `cursor: pointer`（v4のプリフライトは設定しない）、プレースホルダーの色、選択範囲の色、`#root` の最小の高さ
- `App.css` は残している。`npm run build` が成功した
- 未確認: ブラウザでの表示。比較は5〜7章で行う

### タスク3.1（2026-11-09）

- `src/components/buttonStyles.ts` を追加した。共通のクラスと `variant` ごとのクラスを持ち、`buttonClassName(variant, className)` を返す。`Button` と、ボタンの見た目のリンク（`<Link>`）の両方で使う。コンポーネントのファイルからコンポーネント以外を書き出すと Oxlint の `only-export-components` に引っかかるため、別のファイルにした
- `Button` は `buttonClassName` を使い、読み込み中の回転を `animate-spin-fast`（0.7秒）のユーティリティにした
- 枠線の色は共通のクラスに置かず、`variant` ごとに1つだけ指定する。競合しないようにするため
- `button button-*` を直接付けていたリンク（6か所: `RecipeForm`、`RecipeListPage` 2か所、`JoinGroupPage`、`RecipeDetailPage` 2か所）を `buttonClassName()` に置き換えた。`full-width`（4か所）は `w-full` にした
- `App.css` から `.button`、`.button:disabled`、`.button-primary`、`.button-secondary`、`.button-ghost`、`.button-danger` とそれぞれのホバー、`.full-width`、`.button-spinner` の12のルールを削除した
- 外から渡す `className` の確認: `w-full`、`header-add-button`、`google-button`、`setup-submit`、`join-button`、`copy-button`。`w-full` 以外は `App.css` の画面ごとのルールで、レイヤーの外にあるため、これまでどおり `Button` のユーティリティより優先される。ユーティリティどうしの競合はない
- テーマの変更: `--shadow-primary(-hover)` を `--shadow-button(-hover)` に名前を変えた。`shadow-primary` は影の大きさとして解決されることを確かめたが、色のトークン `--color-primary` と紛らわしいため
- v4の `hover:` は `@media (hover: hover)` の中に出力される。ホバーできない端末では、タップ後にホバーの見た目が残らなくなる。見た目の比較（デスクトップのChrome）には影響しない
- 画面のタスクへ持ち越したもの: `App.css` の文脈つきのルール3つ。`.button` / `.button-secondary` のクラスがなくなったため、今は効いていない。該当する画面のタスクで、ユーティリティとして書き直す
  - `.login-form .button { margin-top: 17px }` → 4.1
  - `.detail-actions .button-secondary { padding: 0 11px }`（760px以下） → 4.5
  - `.form-topbar .button { min-height: 38px; padding: 0 12px }`（640px以下） → 4.6
- `npm run lint`: エラー0件。警告4件はいずれも今回変更していない行（`set-state-in-effect` 3件、`incompatible-library` 1件）
- `npm run build` が成功した
- 未確認: ブラウザでの表示。比較は5〜7章で行う

### タスク3.2（2026-11-09）

- 対象の選び方: `App.css` のクラスのうち、2つ以上のファイルで使われているものを抽出した。`editor-*`（材料と作り方の編集）や `orange` / `green` / `blue`（別の部品の色違い）は1つの画面の中の部品なので、画面のタスクで扱う
- 追加したもの
  - `src/components/styles.ts`（クラス文字列の定数と関数）: `eyebrowClassName`、`alertErrorClassName`、`fieldLabelClassName`、`requiredMarkClassName`、`fieldErrorClassName`、`textInputClassName({ error, size, fullWidth })`、`tagClassName`、`tagRowClassName`、`iconButtonClassName({ variant, tall })`、`backLinkClassName`、`pageHeaderClassName`、`pageTitleClassName`、`pageLeadClassName`
  - `src/components/BrandLockup.tsx`: ロゴと名前。`full`（サイドバー、副題つき）、`compact`、`header`（モバイルのヘッダー。名前が15px）。`to` を渡すとリンクになる
  - `src/components/EmptyState.tsx`: 空の表示（アイコン、見出し、説明、操作）
- 決めた書き方
  - 外側の余白や並び順は、使う側で指定する。ただし、すべての使用箇所で同じ値の場合は部品に含める（`alert` の上下の余白、`field-label` の余白）。`tag-row` は一覧のカードで余白と順序が変わるため、余白を含めない
  - ぶつかる差は関数のオプションにした。入力欄のエラーの枠線とフォーカス時の枠線、料理名の大きい入力欄（`size: 'lg'`）、幅の固定（`fullWidth: false`）、アイコンボタンの種類（`muted`、`danger`）と高さ（`tall`）
  - 余白とサイズは、Tailwindの目盛り（1 = 4px、0.25刻み）で書く。13px は `3.25`、35px は `8.75` のようにする
  - 危険操作の枠線（1か所だけの色）は、Decision 3 の 3 に従って不透明度の修飾子にした: エラー表示の枠線 #efcfc8 → `danger/30`、削除ボタンのホバーの枠線 #e8b8ae → `danger/45`、入力欄のエラーの枠線 #dc8e7d → `danger/70`
  - プリフライトの影響への対応: ページ見出しの説明文は、これまでブラウザの既定の余白（1em = 14px）が付いていたため `my-3.5` を明示した。空の表示の見出しは、ブラウザの既定の太字に頼っていたため `font-bold` を明示した
- まだ使っていない: 各画面での置き換えは、該当する画面のタスク（3.3〜4.7）で行う。今置き換えると、`App.css` の文脈つきのルール（`.tag-entry .text-input`、`.recipe-card .tag-row`、`.group-switcher .eyebrow`、`.detail-actions .icon-button` など）が一斉に効かなくなるため。`App.css` の該当ルールは、使用箇所がなくなった時点で削除する
- クラスの確認: スクラッチパッドの確認用スクリプト（`check-classes.mjs`）で、追加・変更したファイルの文字列に含まれるクラスを1つずつTailwindでコンパイルした。`styles.ts` 86、`BrandLockup.tsx` 14、`EmptyState.tsx` 24、`buttonStyles.ts` 32、`Button.tsx` 6 のいずれも、生成されないクラスは0件だった。スクリプトが誤りを検出できることは、存在しないクラス（`text-17`、`bg-red-500`、`flex-cl`）で確かめた
- `npm run lint`: エラー0件、警告4件（3.1と同じ、今回変更していない行）
- `npm run build` が成功した

### タスク3.3（2026-11-09）

- `PageLoader` と `InlineLoader` をユーティリティに書き換えた。回転は `animate-spin`（0.8秒）で、移行前と同じ速さ
- `App.css` から `.page-loader`、`.loader-orbit`、`.inline-loader` の3つのルールを削除した
- 独自クラスの確認: `src/` 全体で `page-loader`、`loader-orbit`、`inline-loader` が0件になった
- `InlineLoader` はどこからも使われていないが、この変更では削除しない（コンポーネントの構造は変えない方針）
- 持ち越し: 招待画面の読み込み中アイコンの `.spin` と、`App.css` の `@keyframes spin` は 4.3 と 4.8 で扱う
- クラスの確認: `Loading.tsx` の16個のクラスがすべて生成された
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した
- 未確認: 読み込み中の表示は一瞬で終わるため、1.1 では撮っていない。5.2 で回転を確認する

### タスク3.4（2026-11-09）

- `AppShell` をユーティリティに書き換えた。ロゴは `BrandLockup`（サイドバーは `full`、モバイルのヘッダーは `header`）、「選択中のノート」は `eyebrowClassName`、ログアウトと設定のボタンは `iconButtonClassName` を使う
- レイアウトはスマートフォンを基準にした。サイドバーは `md:`（761px以上）で表示し、`xl:`（1200px以上）で幅を232pxにする。本体の余白は 640px以下 / 641px〜 / 761px〜 / 1200px〜 の4段階で、移行前と同じ値にした
- `NavLink` の `active`: 関数の `className` で、選択中かどうかに応じてクラスを切り替える。`.nav-item.active svg` の色指定は、親の文字色を継承するのと同じなので省いた
- 1か所だけの色: ローカルプレビュー中の印（#70a982）を `primary/70`（計算上 #71a08b）にした（Decision 3 の 3）
- プリフライトの影響: プリフライトは `svg` を `display: block; vertical-align: middle` にする。下部ナビゲーションの「追加」のアイコンは、行の中のインライン要素として配置されていたため、アイコンとラベルの間が3px縮んだ。`[&>svg]:inline [&>svg]:align-baseline` で元の配置に戻した。文中のアイコンにも同じ影響があるため、画面のタスクで確認する
- `App.css` から39のルールを削除した（`app-frame`、`sidebar`、`main-column`、`main-content`、`group-switcher` 系、`nav-item` 系、`sidebar-add` 系、`sidebar-footer`、`demo-note`、`status-dot`、`account-*`、`mobile-header`、`mobile-nav` と、各メディアクエリ内の同じクラス）。`brand-lockup`、`eyebrow`、`icon-button` は他の画面で使っているため残した
- 独自クラスの確認: `AppShell.tsx` の `className` に `App.css` 由来のクラスが残っていないこと、削除したクラス名が `src/` で使われていないことを確かめた
- クラスの確認: `AppShell.tsx` の97個のクラスがすべて生成された
- 先行してブラウザで確認した（ローカルプレビュー、グループ設定とデモのグループ設定とレシピ一覧、390 / 800 / 1280px）。移行前のスクリーンショットと画素の差分で比べた
  - サイドバー、モバイルのヘッダー、下部ナビゲーション、本体の位置と幅は一致した。差はロゴの角丸（7px → 8px、意図した寄せ）だけだった
  - 本体の中の差分（見出しの太さ、段落の余白など）は、まだ移行していない画面がプリフライトの影響を受けたもの。各画面のタスクで直す
- 比較の道具: スクラッチパッドに `pixelmatch` と `pngjs` を入れ、差分の画像と割合を出すスクリプト（`diff.mjs`）と、拡大して並べるスクリプト（`crop.mjs`）を追加した。撮影スクリプトには、撮る画面を絞る引数を追加した
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク3.5（2026-11-09）

- `LegalPage` をユーティリティに書き換えた。ロゴは `BrandLockup`（`to="/login"` でリンクにする）を使う
- 本文は各ページが書いたHTML（`h2`、`p`、`ul`、`li`、`a`）なので、`LegalPage` 側で `[&_h2]:` などの子孫の修飾子で装飾する
- プリフライトの影響への対応: 箇条書きの記号（`list-disc`）と、見出しの太字（`font-bold`）を明示した。プリフライトはどちらもリセットする
- 余白はスマートフォンを基準にし、`sm:`（641px以上）で移行前の広い画面の値にした
- `App.css` から `legal-*` の14のルールを削除した。`src/` で `legal-` のクラスは0件になった
- クラスの確認: `LegalPage.tsx` の47個のクラスがすべて生成された
- ブラウザでの確認（ローカルプレビュー、プライバシーポリシーと利用規約、390 / 800 / 1280px）: 移行前との画素の差分は6枚とも0.00%（0.005%未満）で、ページの高さも一致した。差分の画像で見える差はロゴの角丸（7px → 8px）だけだった
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.1（2026-11-09）

- `LoginPage` をユーティリティに書き換えた。ロゴは `BrandLockup`、ラベルは `fieldLabelClassName`、エラー表示は `alertErrorClassName` を使う
- 背景: 右上の輪の円（`::before`）と左下のぼかし（`::after`）は `before:` / `after:` の修飾子で書いた。色は直書きの `rgba` ではなく、`color-mix(in srgb, var(--color-primary) …)` でテーマの主色から作った。2つの輪の装飾要素はそのまま残した
- 区切り線（「はじめて使う方へ」の左右の線）も `before:` / `after:` で書いた。説明のセクションの箇条書きは、子孫の修飾子（`[&_li]:`、`[&_strong]:`）で装飾した
- `Button` に `size`（`md` / `lg` / `xl`）を追加した。Googleログインのボタン（高さ50px、間隔10px、文字15px）は `xl`。高さ、間隔、文字サイズは `Button` の内部のクラスと競合するため、外からの `className` ではなくオプションにした（design のリスク対策のとおり）。`lg`（48px）は 4.2、4.3 で使う
- 3.1 からの持ち越し: `.login-form .button { margin-top: 17px }` を、2つのボタンの `mt-4.25` として書き直した
- 文字サイズ: ページの見出しの 27px（640px以下）は 28px に寄せた。説明のセクションの見出しの 17px は、18px にすると390pxで改行の位置が変わった（「管理・/共有」→「管/理・共有」）。そのため、ユーザーの判断で 17px を残し、テーマに `--text-17` を追加した。design.md の Decision 5 に「寄せて改行の位置が変わる場合は元のサイズを残す」というルールを追記した
- `App.css` から44のルールを削除した（`login-*`、`input-with-icon`、`google-button`、`google-icon`、`demo-link` と、各メディアクエリ内の同じクラス）。`src/` でこれらのクラスは0件になった
- クラスの確認: `LoginPage.tsx` の123個のうち、生成されないのは id の `login-email` と `login-about-title` だけだった（クラスではない）
- ブラウザでの確認（ローカルプレビューとデモのログイン画面、390 / 800 / 1280px）
  - 1280px: 差分0.05%、高さは一致した。800px: 差分0.06%、高さは一致した
  - 390px: 高さが2px増えた（1158px → 1160px）。ページの見出しを 27px → 28px にしたため。改行の位置は移行前と同じであることを拡大して確かめた
- 未確認: Supabase接続モードのGoogleログインのボタン（移行前のスクリーンショットがない）。7.1で確認する
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.2（2026-11-09）

- `SetupPage` をユーティリティに書き換えた。`eyebrowClassName`、`fieldLabelClassName`、`textInputClassName`、`alertErrorClassName` を使う。作成ボタンは `Button` の `size="lg"`（48px）
- `textInputClassName` の `size` を整理した。まだ使っていなかった `lg`（料理名の欄）を、意味がわかるように `title` に名前を変えた。また、レシピ帳の名前の欄（高さ50px、文字15px）用に `tall` を追加した
- 特徴の一覧のアイコンの色は、子孫の修飾子ではなく、アイコンに直接 `text-primary` を付けた
- 文字サイズ: 見出しの 29px（641px以上）は 30px に寄せた。390 / 800 / 1280px のいずれも、改行の位置は変わらなかった
- `App.css` の `.setup-page, .join-page` のルールを分け、`.join-page` だけを残した（4.3で扱う）。`setup-*`、`orbit-one`、`orbit-two` を合わせて15のルールを削除した。`src/` でこれらのクラスは0件になった
- クラスの確認: `SetupPage.tsx` の47個のうち、生成されないのは id の `group-name` だけだった。`styles.ts` の88個はすべて生成された
- ブラウザでの確認（ローカルプレビューのセットアップ画面、390 / 800 / 1280px）: 差分は 390px 0.00%、800px 0.53%、1280px 0.33%。高さはすべて一致した。差は見出しの文字幅（29px → 30px）と、それによる下の行の1px程度のずれだった
- 未確認: セットアップ画面のエラー表示（移行前のスクリーンショットがない）。エラー表示は `alertErrorClassName` で、ログイン画面と同じ部品を使う
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.3（2026-11-09）

- `JoinGroupPage` をユーティリティに書き換えた。ロゴは `BrandLockup`、見出しラベルは `eyebrowClassName`、エラーは `alertErrorClassName`、参加ボタンは `Button` の `size="lg"`（48px）を使う
- `.join-page` は2つのルールの重なりで、実際には縦並びのflex（中央寄せ、背景は `background`）だった。その結果に合わせて書いた
- 色: アイコンの両側の線（`#d7e7d9`）は `bg-primary/20` に寄せた（ほぼ同じ色）。エラーのアイコンの背景（`#fff5f2`）は `bg-danger-soft`
- 文字サイズ: 見出しの 27px（640px以下）は 28px、エラーの見出しの 23px は 24px に寄せた。390pxで改行の位置は変わらなかった
- プリフライト対策: 読み込み中のアイコン（`.spin`）は、中央寄せが `text-align` に頼っているため `inline align-baseline` を付けて行内の表示を保った。`em` の斜体は `not-italic` で消した。チェックのアイコンはflexの子なので影響しない
- `App.css` から `join-*`、`line-one`、`line-two`、`.spin`、`.error-icon` と、640px以下のメディアクエリ内の同じクラスを削除した。`src/` でこれらのクラスは0件になった。`@keyframes spin` は 4.8 で削除する
- クラスの確認: `JoinGroupPage.tsx` の76個はすべて生成された
- ブラウザでの確認（ローカルプレビューの招待画面、ログイン前・ログイン後・無効なリンク、390 / 800 / 1280px）
  - 800px と 1280px: 差分0.00%
  - 390px: 差分は約1.8%。見出しを 27px → 28px にしたため、見出しより下が約3px下がった。改行の位置は同じ
- 未確認: エラー表示（「招待リンクが無効です」）と読み込み中の表示。ローカルプレビューでは、無効なトークンでもエラーにならずカードが空のまま表示される（移行前からの動作で、この変更の範囲外）。7.1 のSupabase接続で確認する
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.4（2026-11-09）

- `RecipeListPage`、`RecipeCard`、`RecipeSearch` をユーティリティに書き換えた。ページの見出しは `pageHeaderClassName` / `pageTitleClassName` / `pageLeadClassName`、空の表示は `EmptyState`、タグは `tagClassName` / `tagRowClassName`、エラーは `alertErrorClassName` を使う
- `styles.ts` の `pageHeaderClassName` と `pageTitleClassName` の切り替え位置を直した。移行前は、縦並びと見出しの 28px が640px以下、下の余白 27px が760px以下だった。そのため、`sm:` で横並びと `clamp()`、`md:` で余白 30px にした（まだ使っていなかったので、ほかの画面への影響はない）
- 絞り込みのボタンは、選ばれているかどうかでクラスを切り替える関数にした。選ばれたボタンはホバーで色が変わらない（移行前は `.selected` がホバーより優先されていた）
- 色: ボタンのホバーの枠線（`#bfd0c4`）は `border-hover`、カードのホバーの枠線（`#cbd9d0`）は `primary/25` に寄せた
- 検索欄: フォーカス時は、移行前と同じく影を消して枠の外側の線だけにした（`focus-within:shadow-none`）。プリフライトが入力欄の内側の余白（ブラウザ既定の左右2px）を消すため、`px-0.5` で戻した
- 文字サイズ: 一覧の見出しの 19px は 20px、カードの料理名の 17px は 18px に寄せた。390 / 800 / 1280px のいずれも改行の位置は変わらなかった
- `App.css` から40のルールを削除した（`header-add-button`、`list-toolbar`、`search-field`、`filter-*`、`list-section-heading`、`list-heading-accent`、`recipe-grid`、`recipe-card*` と、各メディアクエリ内の同じクラス）。`src/` でこれらのクラスは0件になった。`page-header`、`eyebrow`、`tag`、`tag-row`、`empty-state`、`alert` は詳細、登録、設定の画面で使っているため残した
- クラスの確認: 4つのファイルのクラスはすべて生成された
- ブラウザでの確認（ローカルプレビューの一覧、タグで絞り込み、検索結果なし、デモの一覧。390 / 800 / 1280px）
  - 差分は0.5〜1.7%。料理名と一覧の見出しの文字サイズの変化による、文字の幅と下の行のずれだった
  - 高さ: 390pxで5px（1139px → 1144px）、800pxで4px（878px → 882px）増えた。料理名の行の高さが1枚につき約1px、一覧の見出しが約1px増えたため。改行の位置は移行前と同じ
- 未確認: 読み込み中の表示と、読み込みのエラー表示（移行前のスクリーンショットがない）。ホバーとフォーカスは 5.2 で確認する
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.5（2026-11-09）

- `RecipeDetailPage` をユーティリティに書き換えた。見つからない時の表示は `EmptyState`、戻るリンクは `backLinkClassName`、削除とその他のボタンは `iconButtonClassName({ tall: true })`、タグは `tagClassName` / `tagRowClassName` を使う
- 3.1 から持ち越した、640px以下の編集ボタンの左右の余白（11px）: `Button` の左右の余白を共通のクラスから各サイズに移し、`compact`（640px以下で左右11px、それ以上で16px）を追加した。外からの `className` で上書きすると競合するため、オプションにした
- 「その他の操作」のボタンは、640px以下だけ表示する（`sm:hidden`）
- 文字サイズ: 番号（`#XX`）の 38px は、30px に寄せると見た目が大きく変わるため、テーマに `--text-38` を追加した。design.md の Decision 5 を更新した。確認ダイアログの見出しの 19px は 20px に寄せた（改行の位置は同じ）
- 色: 材料の丸（`#a9c7b0`）は `primary/40`、削除のアイコンの背景（`#fff5f2`）は `danger-soft`、ダイアログの背景の暗幕（`rgba(31, 41, 37, .38)`）は `text/38` にした
- 作り方の手順をつなぐ線は、`not-last:before:` で書いた
- プリフライト対策: 「材料の記録はありません。」などの段落は、ブラウザ既定の上下の余白（1em）に頼っていたため `my-3.5` を付けた。見出しは太さを明示した
- `App.css` から、詳細の画面のルール60個（`detail-*`、`icon-button`、`danger-icon`、`more-button`、`ingredient-list`、`check-circle`、`steps-list`、`step-list-number`、`muted-copy`、`section-number`、`note-card`、`memo-card`、`source-card`、`modal-backdrop`、`confirm-*`、未使用の `demo-readonly-label`、各メディアクエリ内の同じクラス）を削除した。使う箇所がなくなった `empty-state`、`empty-icon`、`tag-row` の5つも削除した。`src/` でこれらのクラスは0件になった
- クラスの確認: `RecipeDetailPage.tsx` の129個のうち、生成されないのは `ja-JP`（日付の書式）と id の `delete-title` だけだった（クラスではない）
- ブラウザでの確認（ローカルプレビューとデモの詳細、ローカルの削除の確認ダイアログ。390 / 800 / 1280px）
  - 詳細: すべての幅で差分0.00%（390pxの編集ボタンの余白も一致した）
  - 確認ダイアログ: 差分0.2〜0.6%。見出しの 19px → 20px による文字の幅と1pxのずれだけで、改行の位置は同じ
- 未確認: レシピが見つからない時の表示、材料や作り方がない時の表示、参考URLのカード（移行前のスクリーンショットがない）。ホバーは 5.2 で確認する
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.6（2026-11-09）

- `RecipeForm`、`IngredientEditor`、`StepEditor`、`TagInput`、`RecipeEditPage` をユーティリティに書き換えた（`RecipeCreatePage` には独自クラスがなかった）。入力欄は `textInputClassName`、見出しラベルは `fieldLabelClassName` と `requiredMarkClassName`、エラーは `fieldErrorClassName` / `alertErrorClassName`、戻るリンクは `backLinkClassName` を使う
- 3.1 から持ち越した、640px以下の上部の保存ボタン（高さ38px、左右12px）: `Button` に `compact-short`（640px以下で高さ38px・左右12px、それ以上は `md` と同じ）を追加した。下部の保存ボタンは `md` のまま
- 競合するため、オプションにしたもの
  - 作り方の入力欄の高さ（53px）: `textInputClassName` の `size: 'step'`
  - 削除ボタン付きのタグ（右の余白が5px）: `styles.ts` に `editableTagClassName` を追加し、`tagClassName` と共通の部分をまとめた
- 材料と作り方で共通の、一覧、削除ボタン、追加ボタンのクラスは `features/recipes/components/editorStyles.ts` にまとめた
- タグの入力欄は、枠、角丸、影を消す上書きが多いため、`textInputClassName` を使わずにクラスを書いた
- 色: デモの注意書きの枠線（`#d1e5d7`）は `primary/20`、入力欄のエラーの枠線（`#dc8e7d`）は `danger/70`、時間のセクションのアイコン（`#587a9f` / `--blue-soft`）は `info` / `info-soft` にした
- 調理時間と人数の欄のエラー（`small`）は、見出しラベルの太字を継ぐため、移行前と同じく `font-[450]` を付けた
- `App.css` から、フォームのルール63個を削除した（`recipe-form`、`form-*`、`section-*`、`field-*`、`text-input`、`editor-*`、`tag-*`、`helper-text` など）。使う箇所がなくなった `back-link`、`tag`、`alert` も削除した。`src/` でこれらのクラスは0件になった
- クラスの確認: 生成されないのは、URLの文字列、`size` の値の `compact-short`、`key` の接頭辞だけだった（クラスではない）
- ブラウザでの確認（ローカルプレビューとデモの登録・編集、ローカルの料理名のエラー。390 / 800 / 1280px）: 15枚すべて差分0.00%、高さも一致した（390pxの上部の保存ボタンを含む）
- 未確認: 保存のエラー表示、調理時間や参考URLの入力エラー、編集画面の読み込みエラー（移行前のスクリーンショットがない）。フォーカスとホバーは 5.2 で確認する
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.7（2026-11-09）

- `SettingsPage` をユーティリティに書き換えた。ページの見出しは `pageHeaderClassName` / `pageTitleClassName` / `pageLeadClassName`、見出しラベルは `eyebrowClassName` を使う
- ページの見出しの下の余白は、一覧（641px以上で30px）と設定（28px）で違う。`styles.ts` の方針（外側の余白は、全員が同じ値の場合を除き呼び出し側が持つ）に合わせて、`pageHeaderClassName` から余白を外し、各画面で付けるようにした。一覧の画面は 4.4 の結果と差分0.00%のまま
- 役割の表示（`role-pill ${member.role}`）は、`owner` かどうかで色のクラスを切り替える書き方にした
- 色: メンバーのアイコン（`#587a9f` / `--blue-soft`）は `info` / `info-soft`、招待リンクの枠のホバー（`#b9c9be`）は `border-hover`、メンバー数の丸（`20px`）は `rounded-full` にした
- 注記のアイコン（`ShieldCheck`）は、移行前はflexの子として縮んでいた。最初に `flex-none` を付けたところ、390pxで注記の改行の位置が1文字ずれたため、外して移行前と同じにした
- `App.css` から、設定の画面のルールと、使う箇所がなくなった `brand-*`、`eyebrow`、`page-header` を合わせて53個削除した。残りは `:root` の変数、`@keyframes spin`、空のメディアクエリだけになった（4.8で削除する）
- クラスの確認: `SettingsPage.tsx` のクラスはすべて生成された（`-` は文字列の区切りで、クラスではない）
- ブラウザでの確認（ローカルプレビューとデモの設定、390 / 800 / 1280px）: 6枚すべて差分0.00%、高さも一致した
- 未確認: コピーした後の表示（「コピーしました」）、招待リンクのホバー（5.2で確認する）
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した

### タスク4.8（2026-11-09）

- 削除の前に確認したこと
  - `App.css` に残っていたのは `:root` の変数、`@keyframes spin`、空のメディアクエリだけだった
  - `src/` の `.ts` / `.tsx` で、`App.css` の変数（`var(--primary)`、互換用の `--ink`、`--blue` など）の参照は0件だった。`index.css` が参照するのはテーマの変数（`--color-*`）だけだった。`style=` の指定も0件だった
  - 回転のアニメーションはテーマの `@keyframes spin` を使う
- `src/App.css` と、`src/main.tsx` の `import './App.css'` を削除した
- `grep` で、`className` に `[#`、`rgb(` / `rgba(` の任意の色の値がないことを確かめた。任意の値として残っているのは、`max(8px, env(safe-area-inset-bottom))` と `backdrop-blur` のぼかしの量（9px、3px）だけで、色ではない
- 全ファイルのクラスの確認: 生成されないのは id、URL、`key` の接頭辞、データの文字列、`Button` の `size` の値だけで、独自クラスは残っていない
- ブラウザでの確認（移行前の66枚すべてと比較）: 各画面の差分と高さは、4.1〜4.7 の各タスクで記録した値と同じだった。`App.css` の削除による変化はない
- `npm run lint`: エラー0件、警告4件（今回変更していない行）。`npm run build` が成功した
- 気づいた点: `AGENTS.md` に「global styles live in `src/index.css` and `src/App.css`」とあり、実態と合わなくなった

### タスク5.1（2026-11-09）

- 接続設定なしで起動し、1.1 と同じ66枚（22の画面と状態 × 390 / 800 / 1280px）を撮って移行前と比べた（4.8 の比較結果）
- レイアウト、配色、表示される要素の変化はなかった。差はすべて文字サイズをスケールに寄せたことによるもので、改行の位置はどの画面も変わっていない
  - ログイン: 390pxで高さ+2px（見出し 27px → 28px）
  - 一覧（通常、タグで絞り込み、検索結果なし）: 390pxで+5px、800pxで+4px（一覧の見出し 19px → 20px、料理名 17px → 18px）
  - 招待: 390pxで見出しより下が約3px下がる（27px → 28px）。ページの高さは同じ
  - セットアップ、削除の確認ダイアログ: 文字の幅だけ（29px → 30px、19px → 20px）
  - 詳細、登録、編集、設定、規約、プライバシーポリシー: 差分0.00%

### タスク5.2（2026-11-09）

- 移行前のコード（`HEAD`）を別の作業ツリーで起動し（ポート5198）、移行後（ポート5199）と同じ条件で比べた
- ブレークポイント: 640 / 641 / 760 / 761 / 960 / 961 / 1199 / 1200px で、一覧、詳細、登録、設定、招待、セットアップ、ログインを撮った（各56枚）
  - サイドバーと下部ナビゲーションの切り替え（760px → 761px）、1列・2列・3列の切り替え（640 / 641px、1199 / 1200px）は、移行前と同じ幅で起きた
  - 詳細、登録、設定はすべての幅で差分0.00%。それ以外の差は 5.1 と同じ文字サイズによるもので、改行の位置は変わらなかった
- ホバー、フォーカス、無効のボタン: 35の要素（ボタン、リンク、カード、入力欄、絞り込みのボタン、サイドバー、下部ナビゲーション、確認ダイアログ、デモの無効の保存ボタンなど）にホバーまたはフォーカスし、文字色、背景色、枠線の色、影、不透明度、カーソル、移動量を比べた。色は画面に描いた結果で比べた
  - 31の要素は一致した（フォーカスの輪郭、主ボタンの浮き上がりと影、無効のボタンの不透明度とカーソルを含む）
  - 4つの要素は枠線の色だけが違った。いずれも design の Decision 3 で近いトークンに寄せた色
    - 絞り込みのボタンのホバー: `#bfd0c4` → `border-hover`（`#b9c9be`）
    - カードのホバー: `#cbd9d0` → `primary/25`（白の上で `#ccddd5`）
    - 削除のアイコンのホバー: `#e8b8ae` → `danger/45`（白の上で `#e6b6ae`）
    - 入力欄のエラー: `#dc8e7d` → `danger/70`（白の上で `#d88e82`）
- 読み込み中の回転: 移行前の `animation`（ボタン0.7秒、ページと招待画面と小さな読み込み表示0.8秒）と、テーマの `--animate-spin-fast`（0.7秒）/ `--animate-spin`（0.8秒）の対応を確認した。形（大きさ、線の太さ、色）も移行前のルールと同じ値
- 未確認: 実際に回っている様子と、触ったときの印象（ユーザーの目視に回す）

### タスク6.1（2026-11-10）

- 接続設定なしで `demo=1` を付けて起動し、1.1 と同じデモの6画面（一覧、詳細、登録、編集、設定、ログイン）を 390 / 800 / 1280px で撮り直して、移行前と比べた（18枚）
- 詳細、登録、編集、設定はすべての幅で差分0.00%。デモの案内、無効の保存ボタン、無効の削除ボタン、招待リンクの代わりの案内は移行前と同じ
- 一覧とログインの差は 5.1 と同じ文字サイズによるもの（一覧: 390pxで+5px、800pxで+4px。ログイン: 390pxで+2px）。改行の位置は変わらなかった
- 5.2 で、デモの無効の保存ボタンにホバーしたときの不透明度とカーソルが移行前と同じことも確認済み

### タスク8.1・8.2（2026-11-10）

- `npm run lint`: エラー0件、警告4件。警告は移行前のコードでも同じ4件（`set-state-in-effect` が3件、`incompatible-library` が1件）で、今回の変更によるものではない
- `npm run build`: 成功。CSS は 49.57 kB（gzip 8.98 kB）。500 kB を超えるチャンクの警告は JS についてのもので、移行前からある

### タスク7.1（2026-11-10）

- ユーザーが Supabase 接続で起動し、ログイン画面（Googleログインのボタン）、招待画面、グループ設定画面を目視で確認した。崩れはなかった
