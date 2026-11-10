# Design

## Context

目的と範囲は proposal.md、求める動きは specs/ を参照。ここでは、いまの作りのうち進め方に関わる点だけを書く。

- `src/lib/supabase.ts` は、URL と公開可能キーの両方があるときだけ Supabase のクライアントを作り、ないときは `supabase` が `null` になる。`isSupabaseConfigured` で判定している
- ローカルプレビューへの分岐は次の場所にある
  - `AppContext.tsx`: 起動時（`supabase` がないと `bootLocal`）、レシピノートとメンバーの読み込み、`signInLocal`、`signOut`、`createGroup`、`joinGroup`
  - `recipes.ts`: 一覧、詳細、追加、更新、削除で `if (!supabase) return local...`
  - `groups.ts`: 招待トークンからのレシピノートの取得
  - `app-context.ts`: `getMemberDisplayName` が最後に `localGetProfileName` を使う。`isDemoMode`（実際は「ローカルプレビュー中」）と `signInLocal` を公開している
  - 画面: `LoginPage.tsx`（メール入力のフォーム）、`SettingsPage.tsx`（保存先の案内）、`AppShell.tsx`（「ローカルプレビュー中」の表示）
- デモモードは `demoData.ts` の固定データと sessionStorage だけで動き、Supabase を使わない。`isDemoSessionActive()` は URL の `demo=1` か sessionStorage を見る。`AppContext` の `isDemoUser` はこの値で始まる
- レシピノートの読み込み（`getSupabaseGroup`）は、所属のうち作成日時がいちばん古いものを1つだけ使う
- スキーマ: `groups.created_by`、`recipes.created_by` は `auth.users` を参照する。`auth.users` に行が入ると、トリガー `on_auth_user_created` が `profiles` を作る（表示名は `raw_user_meta_data.display_name` か、メールアドレスの「@」の前）
- `supabase/` にはマイグレーションしかなく、`config.toml` はない。Supabase CLI と Docker はこのマシンにない
- `.gitignore` は `*.local` を除外していて、`.env.local` は Git の管理外。`.env.example` は URL と公開可能キーの2行
- ローカルプレビューの初期データ（`localStorage.ts`）のサンプルのレシピは3件（豚の生姜焼き、ふわとろ親子丼、トマトとツナのパスタ）

## Goals / Non-Goals

**Goals:**

- アプリのデータの処理を Supabase だけにし、localStorage の実装を残さない
- 手元で `npm ci` と数個の npm スクリプトだけで、本番と同じスキーマの Supabase を立ち上げられる
- 接続設定がない状態で開いても、何をすればよいかが画面でわかる
- 秘密情報（Google の OAuth のシークレット）をリポジトリに入れない

**Non-Goals:**

- 複数のレシピノートへの所属の扱いの変更（いちばん古い所属を使う動きはそのまま）
- 本番の Supabase、Vercel、Google の本番の設定の変更
- ブラウザに残ったローカルプレビューのデータ（`my-recipe-local-state`）の削除処理

## Decisions

### 1. 接続設定がないときは、ルートの手前で知らせる画面に差し替える

`App.tsx` の `AppRoutes` の先頭で、接続設定がなく、デモモードでもないときは、どの URL でも新しい画面 `src/pages/SupabaseSetupPage.tsx` を表示する。

```
AppRoutes
  isSupabaseConfigured? --yes--> いまのルート
        | no
        v
  isDemoUser? --yes--> いまのルート（デモの固定データ）
        | no
        v
  SupabaseSetupPage（どの URL でも）
```

- `isDemoUser` はコンテキストの値を使う。`demo=1` 付きの URL で開いたときは最初から `true` なので、知らせる画面を経ずにデモになる（仕様の「デモのURLから開く」）
- 画面の「デモのレシピを見る」は、ログイン画面と同じく `enterDemo()` を呼んで `/recipes?demo=1` に移る
- `AppContext` の起動処理は、`supabase` がないとき `bootLocal` の代わりに、利用者なしで `authReady` を `true` にするだけにする
- 画面の中身（スマホ基準。ログイン画面と同じ背景とカードの形を使う）
  - 見出し: 「接続設定がありません」
  - 説明: Supabase の接続先が設定されていないこと
  - 手順（番号付き、コマンドは `font-mono`）: `npm run db:start` で Supabase Local を起動する → `npm run db:status` で表示される URL と公開可能キーを `.env.local` に書く → 開発サーバーを起動し直す。詳しくは README を見るよう案内する
  - 「デモのレシピを見る」のリンク
- 本番（Vercel）には接続設定があるので、この画面は出ない

他の案: 起動時（`supabase.ts`）にエラーを投げる方法は、デモも見られなくなるので使わない（探索で決定）。

### 2. Supabase のクライアントは、使う場所で必ずあるものとして取り出す

`src/lib/supabase.ts` に、クライアントを返し、ないときはエラーを投げる関数を足す。

```ts
export const getSupabase = () => {
  if (!supabase) throw new Error('Supabaseの接続設定がありません。')
  return supabase
}
```

- `recipes.ts`、`groups.ts`、`AppContext.tsx` の `if (!supabase) return local...` の分岐は、`getSupabase()` を使う形にして localStorage の分岐を消す。決定1の画面があるので、通常はこのエラーには届かない
- `isSupabaseConfigured` は決定1の判定に使うので残す
- `src/lib/localStorage.ts` は削除する。`getMemberDisplayName` の `localGetProfileName` の段も削除する（表示名は `profiles` から取れる）
- `AppContextValue` から `isDemoMode` と `signInLocal` を削除する。使っている `LoginPage.tsx`、`SettingsPage.tsx`、`AppShell.tsx` から、メール入力のフォーム、保存先の案内、「ローカルプレビュー中」の表示を削除する。`AppShell` のサイドバーの表示は `isDemoUser` のときの「デモモード」だけになる

### 3. Supabase CLI は npm の開発用の依存にし、npm スクリプトから使う

- `supabase` パッケージを `devDependencies` に入れる。バージョンは、入れる時点で公開から2週間以上たった安定版を選び、`package-lock.json` で固定する（npm で入れると、インストール時に CLI の実行ファイルが取得される）
- `npx supabase init` で `supabase/config.toml` と `supabase/.gitignore` を作り、決定4のとおりに直す
- npm スクリプト

  | スクリプト | 中身 | 用途 |
  |---|---|---|
  | `db:start` | `supabase start` | Supabase Local を起動する（初回はマイグレーションと seed が当たる） |
  | `db:stop` | `supabase stop` | 停止する |
  | `db:reset` | `supabase db reset` | DB を作り直し、マイグレーションと seed を当て直す |
  | `db:status` | `supabase status -o env` | `API_URL` と `PUBLISHABLE_KEY` などを、名前の決まった形で表示する（Studio の URL やシークレットキーと取り違えないため） |

- Docker の実行環境は OrbStack を使う前提で README に書く。リポジトリには入らない

### 4. `config.toml` で Google ログインと戻り先を設定し、シークレットは `supabase/.env` から読む

`supabase init` が作る設定から、次の項目を変える。

```toml
project_id = "my-recipe"

[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/login**"]

[auth.email]
enable_signup = false

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = false
```

- 戻り先は本番と同じく `/login**` にする（`?returnTo=...` が付くため。README の本番の設定と同じ理由）
- メールでの新規登録は無効にし、本番と同じく Google だけでログインする形にそろえる。seed のサンプル用のユーザーは SQL で直接入れるので、この設定の影響を受けない
- クライアント ID とシークレットは、Supabase CLI が読む `supabase/.env` に書く。`supabase init` が作る `supabase/.gitignore` が `.env` を除外することを確かめ、除外されていなければ追記する
- Google Cloud では、本番と同じ OAuth クライアントの承認済みのリダイレクト URI に `http://127.0.0.1:54321/auth/v1/callback` を足す（利用者の手作業）

### 5. seed はサンプル用のユーザー、レシピノート、レシピを決まった ID で入れる

`supabase/seed.sql` で次を入れる。`supabase db reset` のたびに同じ状態になる。

- `auth.users` にサンプル用のユーザーを1人入れる（決まった UUID、メールアドレス `sample@example.com`、`raw_user_meta_data` に `{"display_name": "サンプル"}`、パスワードなし）。パスワードがなく、メールでの登録も無効なので、このユーザーではログインできない。`profiles` はトリガーで作られる
- `groups` に「サンプルのレシピノート」を入れる。`invite_token` は決まった UUID にする
- `group_members` にサンプル用のユーザーをオーナーとして入れる
- `recipes` に、いまのローカルプレビューの初期データの3件を移す（`created_by` はサンプル用のユーザー）
- 手元での使い方（README に書く）: Google でログインした後、レシピノートを作る前に `http://localhost:5173/join/<決まった招待トークン>` を開いて参加する。レシピノートの読み込みはいちばん古い所属を使うため、先に自分のレシピノートを作ると、サンプルのほうは表示されない。そうなったときは `npm run db:reset` で作り直す

他の案: 自分の Google アカウントを seed に入れる方法は、ID がログインするまでわからないので使わない（探索で決定）。

### 6. 文書と OpenSpec の設定を2つのモードに書き換える

- `README.md`: 「ローカルで確認する」を、OrbStack と Supabase Local の準備、`.env.local`、`supabase/.env`、Google Cloud の戻り先の追加、サンプルのレシピノートへの参加の手順に書き換える。Google ログインの設定の章の、ローカルプレビューの文と、Supabase の Redirect URLs の開発用の行（Supabase Local の `config.toml` で設定するようになる）を直す。`.env.local` は手元の値だけにし、本番の値は Vercel にだけ置くことを書く
- `.env.example`: 値の例を Supabase Local の URL（`http://127.0.0.1:54321`）にする
- `AGENTS.md`: `src/lib/` の説明から localStorage を外す。コマンドの章に `db:*` のスクリプトを足す。確認の章を「Supabase Local での確認（RLS と RPC を含む）とデモの制限の確認」に書き換える
- `openspec/config.yaml`: `context` の動作モードを2つ（Supabase接続〔手元では Supabase Local〕、デモ）にし、接続設定がないときの画面にも触れる。`rules` の「影響する動作モード（Supabase / ローカルプレビュー / デモ）」を2つに、「ローカルプレビュー（localStorage）側のデータ形式もあわせて扱う」を「スキーマを変えるときは `supabase/seed.sql` が新しいスキーマで当たるかもあわせて扱う」に置き換える
- アーカイブの後、`openspec/specs/app-modes/spec.md` の Purpose の「ローカルプレビュー」を直接直す（仕様の変更の仕組みでは Purpose を変えられないため）

## Risks / Trade-offs

- [Docker（OrbStack）が必要になり、手元の準備が重くなる] → README に手順をまとめる。Docker なしでもデモモードは見られる
- [`supabase start` の初回はイメージの取得に時間がかかる] → README に初回は時間がかかることを書く
- [seed で `auth.users` に直接入れる列が、Supabase の Auth のバージョンで変わることがある] → 必要な列（`id`、`instance_id`、`aud`、`role`、`email`、`raw_user_meta_data`、作成日時）だけを入れ、`npm run db:reset` が通ることを確かめる
- [Google の戻り先に `127.0.0.1` と `localhost` が混ざり、Cookie や戻り先の照合でつまずく] → Supabase Local の API は `127.0.0.1:54321`、アプリは `localhost:5173` に統一し、`site_url` と `additional_redirect_urls` は `localhost` で書く。手動確認で Google ログインが戻ってくることを確かめる
- [手元から本番の DB を確かめる手段がなくなる] → 探索で決めたとおり、本番の動きは Vercel の本番のデプロイで確かめる。Vercel のプレビューの環境には Supabase の環境変数を設定しない（プレビューから本番の DB に触れないため）。プレビューでは接続設定がないときの画面とデモが表示され、本番の Supabase への接続はマージした後に本番で確かめる
- [Supabase CLI の npm パッケージはインストール時に実行ファイルを取得するため、`npm ci` がネットワークに依存する] → 開発用の依存なので、Vercel のビルドへの影響を確かめる（Vercel のビルドでも `devDependencies` が入るため、取得に失敗するとビルドが止まる）。問題があれば Vercel のインストールの設定を見直す
- [ブラウザにローカルプレビューのデータが残る] → 使われなくなるだけで害はない。消す処理は入れない
