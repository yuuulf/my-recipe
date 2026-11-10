# Proposal

## Why

レシピを登録するとき、レシピサイトやメモの文章を見ながら、料理名、材料、作り方などを1つずつ入力し直している。材料や作り方は行ごとに分けて入れる必要があり、手間がかかる。貼り付けた文章から AI が下書きを作り、フォームに入れられるようにして、「簡単に登録」を進める。

## What Changes

UI の変更に加えて、サーバー側の処理（Supabase Edge Function）と外部の AI サービス（OpenRouter）への接続を追加する。データベースのスキーマ、RLS、ルーティングは変えない。

- レシピの追加画面に、文章を貼り付けて AI で下書きを作る機能を追加する
  - 貼り付けた文章から、料理名、説明、材料、作り方、タグ、調理時間、人数、参考URL、メモを読み取り、フォームに入れる
  - 下書きは保存しない。利用者がフォームで確かめて直し、いまと同じ保存の操作で保存する
  - フォームにすでに入力がある場合は、置き換えてよいかを確かめてから入れる
  - 文章が空のとき、長すぎるときは送らない
  - 読み取れなかったとき、回数の上限を超えたとき、AI サービスにつながらないときは、理由を表示し、フォームは変えない
- AI の呼び出しは Supabase Edge Function で行う
  - OpenRouter の API キーはサーバー側のシークレットにだけ置き、ブラウザには渡さない
  - ログインしていて、いずれかのレシピノートのメンバーである利用者の要求だけを受け付ける
  - 使う AI モデルは、コードに書かずにシークレット（環境変数）で指定する。最初は OpenRouter の無料のモデル（ID が `:free` で終わるもの）のうち、決まった形の JSON で返す機能（構造化出力）に対応したものを、利用者が選んで設定する
  - AI の返した内容は、サーバー側で形を確かめてから画面に返す。形が崩れていたら「読み取れなかった」として扱う
- デモモードでは、AI の下書きは使えない（保存と同じく無効）
- プライバシーポリシーに、AI の下書きを使うと入力した文章が外部の AI サービスに送られることを書き足す
- README と `.env.example` などに、手元（Supabase Local）と本番で OpenRouter の API キーとモデルを設定する手順を書く

対象外:

- URL や写真から下書きを作る機能（別の変更で扱う）
- 編集画面での AI の下書き（まずは追加画面だけにする）
- 入力済みの内容からタグや説明文を提案する機能
- Claude など OpenRouter 以外の AI サービスへの直接の接続
- 利用者ごとの1日の回数の上限（OpenRouter の無料枠の上限と、文章の長さの上限で足りる前提。使ってみてから判断する）
- 有料のモデルへの切り替えの仕組み（モデルの ID の設定を変えれば切り替えられるが、料金の管理は扱わない）

影響する動作モード:

- Supabase接続（手元では Supabase Local）: 追加画面で AI の下書きを使える。Edge Function と OpenRouter のシークレットが必要
- デモ: AI の下書きは使えない。データも変わらない

利用者が行う準備（リポジトリの外）:

- OpenRouter のアカウントと API キーを作る
- 使う無料のモデルを選ぶ（構造化出力に対応していること、送った文章の扱い（記録や学習）に問題がないことを確かめる）
- 手元では Supabase Local の Edge Function のシークレット、本番では Supabase のプロジェクトのシークレットに、API キーとモデルの ID を設定する
- 本番の Supabase に Edge Function をデプロイする

## Capabilities

### New Capabilities

- `recipe-draft-assist`: 貼り付けた文章から AI でレシピの下書きを作り、追加画面のフォームに入れる機能。利用できる人、入力の制限、失敗したときの扱い、デモモードでの扱いを定める

### Modified Capabilities

なし（レシピの登録、入力の検証、保存の要件は変わらない。下書きは保存の前のフォームの値で、保存はいまの要件のとおりに行う）

## Impact

- 追加: `supabase/functions/` の Edge Function（OpenRouter を呼び、結果の形を確かめて返す）
- 追加: AI の下書きの入力欄とボタン（`src/features/recipes/components/` の新しい部品）、Edge Function を呼ぶ処理（`src/features/recipes/api/`）
- 変更: `src/pages/RecipeCreatePage.tsx` または `src/features/recipes/components/RecipeForm.tsx`（下書きをフォームに入れる）
- 変更: `src/pages/PrivacyPolicyPage.tsx`（外部の AI サービスへの送信）
- 変更: `supabase/config.toml`（Edge Function の設定）、`.gitignore`（Edge Function のシークレットのファイル）、`README.md`、`AGENTS.md`
- 外部サービス: OpenRouter（無料のモデル。1日50回、クレジットを10以上買うと1日1,000回までの上限がある）
- スキーマ、RLS、マイグレーション: 変更なし
- 依存パッケージ: アプリ（ブラウザ）側には増やさない。Edge Function 側で使うものは design で決める
