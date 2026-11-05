# Proposal

**変更の種類:** 仕様の文書化のみ。UI・データ・API・ルーティングのいずれも変更しない。

## Why

アプリは実装済みだが `openspec/specs/` が空で、今後の変更で「何を維持すべきか」を判断する基準がない。既存コードの正しい振る舞いをbaselineのspecとして記録し、以後のchangeの差分の起点にする。

## What Changes

- 既存の振る舞いのうち正しいと確認できたものを、3つのcapabilityのspecとして `ADDED` で記録する
- 仕様ではないバグ・未実装（下記「既知の差異」）はspecに含めず、この文書に記録する
- アプリのコードとスキーマは変更しない

利用者に見える効果はない。開発者にとっては、以後のchangeが差分として書けるようになる。

### 対象範囲

- レシピの登録・閲覧・編集・削除、検索・絞り込み、動作モードの判定とレシピデータの扱い
- 3つの動作モードすべて: Supabase接続 / ローカルプレビュー / デモ（いずれも振る舞いの変更はなく、記録のみ）

### 対象外

- 認証（Googleログインへの変更を予定しているため、現在のメールリンク認証を仕様として固定しない）
- グループ（作成、招待、参加、メンバー、役割）。レシピのspecでは、レシピの所属先とアクセス範囲としてのみ言及する
- 既知の差異の修正（修正ごとに別のchangeで行う）
- 新機能の追加
- 見た目やレイアウトの細部

### 既知の差異

以下はバグまたは未実装であり、仕様ではない。#2、#5、#7、#10はこのchangeのspecの範囲に関わるため、該当部分を書かずに除外した。それ以外は認証またはグループの範囲であり、このchangeのspecの対象外である。

| # | 現在の挙動 | 箇所 | 区分 |
|---|---|---|---|
| 1 | グループ読み込みの失敗時にも、未所属と同じく `/setup` へ遷移する | `src/contexts/AppContext.tsx`、`src/App.tsx` | グループ |
| 2 | レシピ詳細の「登録者」に、閲覧者自身の名前が表示される | `src/pages/RecipeDetailPage.tsx` | レシピ |
| 3 | 2つ目のグループに参加すると、Supabaseでは最古のグループが表示されたままになり、ローカルでは参加先に切り替わる。切替UIもない | `src/contexts/AppContext.tsx`、`src/lib/localStorage.ts` | グループ |
| 4 | 招待トークンが無効な場合、ローカルではカードの中身が空になる。Supabaseでの表示は未確認 | `src/pages/JoinGroupPage.tsx` | グループ |
| 5 | 検索語の `%` と `_` が、Supabaseではワイルドカード、ローカルとデモでは文字どおりに扱われる | `supabase/migrations/20260928000000_initial_schema.sql`、`src/lib/localStorage.ts` | 検索 |
| 6 | ローカルプレビューのログイン画面に「デモモードでログイン」やリンク送付の文言が表示される。内部の `isDemoMode` の実体もローカルプレビューである | `src/pages/LoginPage.tsx`、`src/contexts/AppContext.tsx` | 認証 |
| 7 | レシピ詳細の「…」ボタンを押しても何も起きない | `src/pages/RecipeDetailPage.tsx` | レシピ |
| 8 | グループ名の上限が画面では50文字、DBでは80文字である | `src/pages/SetupPage.tsx`、`supabase/migrations/20260928000000_initial_schema.sql` | グループ |
| 9 | ownerとmemberの権限に差がなく、`is_group_owner` も未使用である | `supabase/migrations/20260928000000_initial_schema.sql` | グループ。`recipes` のspecでもメンバー間の権限の差は規定しない |
| 10 | Supabase接続時にUUID形式でないIDのレシピURLを開くと、「見つかりません」ではなくDBのエラー文が表示される | `src/pages/RecipeDetailPage.tsx`、`src/pages/RecipeEditPage.tsx`、`src/features/recipes/api/recipes.ts` | レシピ |

## Capabilities

### New Capabilities

- `app-modes`: 動作モードの判定と、デモモードの読み取り専用などレシピデータの扱いの原則
- `recipes`: レシピの登録、一覧、詳細、編集、削除、および入力検証とアクセス制御
- `recipe-search`: キーワード検索とタグによる絞り込み

### Modified Capabilities

なし。

## Impact

- 追加されるのは `openspec/specs/` 配下のspecのみ
- コード、スキーマ、API、依存関係、localStorageのデータ形式への影響はない
- マイグレーションの追加や適用は不要
