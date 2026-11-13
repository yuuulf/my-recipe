# Design

## Context

目的と範囲は proposal.md、求める動きは specs/ を参照。ここでは、いまの作りのうち進め方に関わる点だけを書く。

- フォーム（`RecipeForm.tsx`）は react-hook-form と zod の `recipeSchema` で検証している。いまの検証は、料理名が空でないこと、調理時間と人数が正の整数であること（`type="number" min="1"` も付いている）、参考URLが `http(s)://` で始まることだけ。エラーは各欄の下に `fieldErrorClassName` で出し、材料と作り方は編集欄の下に `errors.ingredients?.message` を1つだけ出す
- フォームの材料と作り方は、空の行を含む配列のまま持ち、保存のときに空の行を除く。タグは `TagInput` が配列を直接持つ（Enter、カンマ、追加ボタンで追加。変換中かどうかを見ていない）
- `recipes` テーブルの制約は、料理名 1〜160文字（前後の空白を除く）、調理時間と人数が正の数だけ。説明、材料、作り方、タグ、参考URL、メモには制約がない
- RPC `create_group(p_name)` は `trim(p_name)` を入れるだけで、長さはテーブルの制約（1〜80文字）にしか任せていない。画面は `maxLength={50}`。名前の変更の RPC `rename_group` は1〜50文字を確かめている
- AI の下書きの Edge Function（`supabase/functions/recipe-draft/index.ts`）は、料理名160文字、各行500文字、各項目2,000文字、配列50件、タグ10個で整えている。フォームの新しい上限より緩い
- RLS は変えない。`recipes` の更新はメンバーなら誰でもできる（`updated_by = auth.uid()` の条件つき）

## Goals / Non-Goals

**Goals:**

- 上限の値を、フォーム（zod と入力欄）で1か所にまとめて持つ
- サーバー側（データベースの制約、RPC）でも同じ上限を守る
- 既存のデータを壊さずに制約を足す

**Non-Goals:**

- 上限を超える既存のデータを直すマイグレーション

## Decisions

### 1. 上限の値は `src/features/recipes/recipeLimits.ts` にまとめる

```ts
export const RECIPE_LIMITS = {
  title: 100,
  description: 500,
  ingredientLine: 100,
  stepLine: 500,
  lines: 50,          // 材料、作り方それぞれの行数
  tag: 20,
  tags: 10,
  cookingTimeMinutes: 4320,
  servings: 100,
  sourceUrl: 2000,
  memo: 2000,
} as const
```

- zod のスキーマ、文字数の表示、`TagInput`、行の追加ボタンはこの値を使う
- Edge Function とマイグレーションは同じ値を自分のファイルに書き、`recipeLimits.ts` と同じ値であることをコメントで示す（Deno と SQL からは `src/` を読めないため）

### 2. フォームの検証は zod で行い、文章の入力欄に `maxLength` は付けない

- 料理名、説明、参考URL、メモは `.max(...)` を付け、超えたら「〇〇文字以内にしてください。」を出す
- 文章の入力欄に `maxLength` を付けない。付けると、貼り付けた長い文章が黙って切られるため。代わりに説明とメモの下に「123 / 500」の文字数を出し、超えたら赤くする
- 参考URLは `/^https?:\/\/\S+/` で、スキームの後ろに続きがあることを確かめる
- 調理時間と人数は `.max(...)` を足し、入力欄にも `max` を付ける
- 材料と作り方は、空の行を除いた行について、行数（50行まで）と1行の長さを `superRefine` で確かめ、編集欄の下のエラーにまとめて出す（例「材料は1行100文字以内にしてください（3行目）。」「材料は50行までです。」）
- 行の追加ボタンは、行数が50に達したら無効にする
- レシピノートの名前（セットアップ画面と設定画面）も `maxLength` を外し、文字数の表示とエラーで知らせる。上限の50は `src/features/groups/recipeNoteLimits.ts` にまとめる（実装の後に、レシピノートの名前だけ `maxLength` が残っていることを利用者と相談してそろえた）
- 検証のタイミングは react-hook-form の `mode: 'onTouched'` にする（欄から離れたときに検証し、その後は入力のたびに検証し直す）。保存ボタンが無効のデモモードでもエラーが出るようにするため。実装の後の確認で、保存を押したときだけ検証する作りではデモモードでエラーが出ないことが分かり、利用者と相談して決めた
- 材料、作り方、タグの配列全体のエラーは、react-hook-form が `errors.<名前>.root` に入れることがあるため、`message` と `root.message` の両方を見る

### 3. タグの入力欄は、変換中の Enter を無視し、上限を超えるタグを追加しない

- `onKeyDown` の最初に `event.nativeEvent.isComposing || event.keyCode === 229` なら何もしない（名前の変更の入力欄と同じ。229 は Safari 向け）
- 追加するときに、20文字を超えるなら「タグは20文字以内にしてください。」、すでに10個なら「タグは10個までです。」を入力欄の下に出し、追加しない。入力を変えたらメッセージを消す
- 追加ボタンもタグが10個なら無効にする
- zod の `tags` にも `.max(10)` と各要素の `.max(20)` を付ける（AI の下書きなどで入った場合のため）

### 4. マイグレーションで `recipes` に制約を足し、`create_group` に上限を足す

`supabase/migrations/20261113000000_add_input_limits.sql` を足す。既存のマイグレーションは書き換えない。

```sql
-- 配列の件数と各要素の長さを確かめる（制約から呼ぶので immutable）
create or replace function public.text_array_within(p_values text[], p_max_items int, p_max_length int)
returns boolean language sql immutable as $$
  select coalesce(cardinality(p_values), 0) <= p_max_items
    and not exists (select 1 from unnest(p_values) as v where char_length(v) > p_max_length);
$$;

alter table public.recipes
  add constraint recipes_title_length check (char_length(trim(title)) <= 100) not valid,
  add constraint recipes_description_length check (description is null or char_length(description) <= 500) not valid,
  add constraint recipes_ingredients_limits check (public.text_array_within(ingredients, 50, 100)) not valid,
  add constraint recipes_steps_limits check (public.text_array_within(steps, 50, 500)) not valid,
  add constraint recipes_tags_limits check (public.text_array_within(tags, 10, 20)) not valid,
  add constraint recipes_cooking_time_max check (cooking_time_minutes is null or cooking_time_minutes <= 4320) not valid,
  add constraint recipes_servings_max check (servings is null or servings <= 100) not valid,
  add constraint recipes_source_url_format check (source_url is null or (char_length(source_url) <= 2000 and source_url ~* '^https?://\S')) not valid,
  add constraint recipes_memo_length check (memo is null or char_length(memo) <= 2000) not valid;
```

- 料理名は、いまの制約（1〜160文字）を残したまま、100文字の制約を重ねる。いまの制約を作り直すと既存の行を確かめ直すことになるため、ほかの項目と同じく `not valid` で足す（利用者の指示で、サーバー側の料理名の上限も100文字にそろえた）
- `not valid` で足すので、既存の行は確かめない（上限を超える既存のレシピがあってもマイグレーションは通る）。新しく入れる行と、更新する行には制約がかかる
- `create_group` は `create or replace` で作り直し、`trim` した名前が1〜50文字でなければ `rename_group` と同じ文言と `errcode = '22023'` で拒否する。ほかの動き（作成者をオーナーにする）は変えない
- RLS への影響: なし（制約と関数だけ）
- `seed.sql` への影響: サンプルのレシピ3件は上限の内側なので、そのまま当たる。`npm run db:reset` で確かめる

他の案: 上限を超える既存のデータを先に切り詰めてから `not valid` なしで制約を足す方法は、利用者のデータを黙って変えることになるので使わない。

### 5. AI の下書きの上限をフォームにそろえる

Edge Function の整える処理を、料理名100文字、説明500文字、材料の各行100文字、作り方の各行500文字、各配列50件、タグ20文字で10個、参考URLとメモ2,000文字、調理時間は4,320分以下、人数は100人分以下（範囲の外は空にする）に変える。下書きを入れた直後にフォームのエラーが出ないようにするため。

## Risks / Trade-offs

- [上限を超える既存のレシピを編集すると、保存の前に直す必要がある] → 仕様に場面として書いた。エラーは該当する欄に出るので、どこを直せばよいか分かる
- [本番にマイグレーションを当てる前にフロントエンドがデプロイされる] → 画面の上限はフロントエンドだけで効く。サーバーの制約は、マイグレーションを当てるまで効かない。PR に手順を書く
- [文章の入力欄に `maxLength` を付けないので、上限を超えて入力できる] → 文字数の表示とエラーで知らせる。貼り付けた文章が黙って切られるより分かりやすい
- [画面と Edge Function と SQL に同じ値が3か所ある] → コメントで相互に示し、確認のタスクで3か所の値が一致することを確かめる
- [AI の下書きで長い料理名が100文字で切られる] → 利用者は保存の前にフォームで確かめる
