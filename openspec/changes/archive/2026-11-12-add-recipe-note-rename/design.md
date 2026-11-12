# Design

## Context

目的と範囲は proposal.md、求める動きは specs/recipe-note-management/spec.md を参照。ここでは、いまの作りのうち進め方に関わる点だけを書く。

- `groups` テーブルの RLS ポリシーは `groups_select`（メンバーが読める）と `groups_insert` だけで、更新のポリシーはない。そのため、いまは誰も名前を変えられない
- `groups.name` には `char_length(trim(name)) between 1 and 80` の制約がある。画面のセットアップでは `maxLength={50}` で作っている
- オーナーかどうかは `public.is_group_owner(p_group_id, p_user_id default auth.uid())`（`security definer`）で判定できる。RPC は `create_group`、`join_group` などと同じく `security definer` で作り、`authenticated` に実行を許可する形がすでにある
- `AppContext` は `groups`（所属の一覧）と `group`（開いているレシピノート）を持ち、サイドバーとヘッダーの切り替えの一覧は `groups` を、設定画面は `group` を表示している
- 設定画面（`SettingsPage.tsx`）のレシピノートの情報のカードは、見出しに名前、その下にオーナーとメンバー数を表示している。`members` に自分の行があり、`role` でオーナーかが分かる
- デモモードは固定のデータで、設定画面に「デモモードの固定データを表示しています。」が出る

## Goals / Non-Goals

**Goals:**

- 名前の変更を、オーナーの確認つきの RPC だけで行う（名前以外の列は変えられない）
- 変えた名前を、再読み込みなしで設定画面とサイドバーとヘッダーに反映する

**Non-Goals:**

- ほかのメンバーの画面へのリアルタイムの反映（次に読み込んだときに反映される）
- 名前の重複の禁止（同じ名前のレシピノートがあってもよい）

## Decisions

### 1. マイグレーションで RPC `rename_group` を追加する

`supabase/migrations/<タイムスタンプ>_add_rename_group.sql` を足す。既存のマイグレーションは書き換えない。

```sql
create or replace function public.rename_group(p_group_id uuid, p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  next_name text := trim(coalesce(p_name, ''));
  renamed public.groups;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。' using errcode = '28000';
  end if;
  if char_length(next_name) not between 1 and 50 then
    raise exception 'レシピノートの名前は1〜50文字にしてください。' using errcode = '22023';
  end if;
  if not public.is_group_owner(p_group_id, auth.uid()) then
    raise exception 'レシピノートのオーナーだけが名前を変更できます。' using errcode = '42501';
  end if;

  update public.groups set name = next_name where id = p_group_id
  returning * into renamed;
  return renamed;
end;
$$;

revoke execute on function public.rename_group(uuid, text) from public, anon;
grant execute on function public.rename_group(uuid, text) to authenticated;
```

- 更新するのは `name` の列だけ。招待トークン、作成者は変わらない
- オーナーでない、メンバーでない、存在しないレシピノートは、どれも `is_group_owner` が偽になり拒否される（存在の有無を区別しない）
- 50文字の上限は画面と同じ。テーブルの制約（80文字）より厳しいので、制約にかかることはない
- RLS への影響: `groups` のポリシーは変えない。`security definer` の関数の中で、オーナーの確認の後に名前だけを更新する。直接の `update` はいままでどおりできない
- `seed.sql` への影響: なし。`npm run db:reset` でマイグレーションと seed が当たることを確かめる

他の案: `groups` にオーナーだけが更新できる RLS ポリシーを足す方法は、名前以外の列（招待トークン、作成者）も更新できてしまうので使わない。列ごとの権限（`grant update (name)`）と組み合わせる方法もあるが、既存の RPC の作りにそろえて RPC にする。

### 2. `AppContext` に `renameGroup` を足す

```ts
renameGroup: (groupId: string, name: string) => Promise<Group>
```

- デモモードでは `デモモードではレシピノートを変更できません。` を投げる（ほかの操作と同じ）
- 送る前に、前後の空白を除いた名前が1〜50文字かを確かめ、違えば投げる（RPC と同じ文言）
- RPC の結果（更新後の `groups` の行）で、`groups` の該当する要素と、開いているレシピノートなら `group` を置き換える。これでサイドバー、ヘッダー、切り替えの一覧、設定画面がすぐ新しい名前になる
- RPC のエラーは、PostgREST が返すメッセージ（関数の `raise exception` の文言）をそのまま画面に出す

### 3. 設定画面: カードの見出しの横に「名前を変更」を置き、その場で入力欄に切り替える（スマホ基準）

```
通常（オーナー）                           編集中
+---------------------------------+        +---------------------------------+
| [icon] 我が家のレシピ   [鉛筆]  |        | [icon] レシピノートの名前       |
|---------------------------------|        | [ 我が家のレシピ          ]     |
| オーナー           サンプル     |        |                       12 / 50   |
| メンバー数             2人      |        | [保存] [キャンセル]             |
+---------------------------------+        |---------------------------------|
                                           | オーナー           サンプル     |
                                           +---------------------------------+
```

- 自分がオーナー（`members` の自分の行の `role` が `owner`）で、デモモードでないときだけ、見出しの右に鉛筆のアイコンのボタン（`iconButtonClassName`、`aria-label="レシピノートの名前を変更"`）を出す
- 押すと、見出しの名前の代わりにラベル「レシピノートの名前」と入力欄（`textInputClassName`、`maxLength={50}`、今の名前を入れて全選択）、文字数、「保存」と「キャンセル」を出す
- Enter で保存、Esc でキャンセル。日本語の変換を確定・取り消す Enter と Esc（`isComposing`、Safari の `keyCode` 229）は無視する（実装の後の確認で、変換の Enter で保存される不具合が見つかり直した）。保存中はボタンを読み込み中にする
- 保存に成功したら通常の表示に戻す。失敗したらカードの中にエラー（`alertErrorClassName`）を出し、入力欄はそのまま残す
- 空や空白だけのときは、保存を押しても RPC を呼ばず「レシピノートの名前を入力してください。」を出す
- 開いているレシピノートを切り替えたら、編集中の状態は閉じる
- PC でも同じ並べ方（カードは2列のうち左）

## Risks / Trade-offs

- [オーナーが名前を変えた後、ほかのメンバーの開いている画面は古い名前のまま] → 次に読み込んだとき（再読み込み、切り替え、アプリを開き直す）に新しい名前になる。家族と友人で使う規模なのでリアルタイムの反映はしない
- [本番の Supabase にマイグレーションを当てる前にフロントエンドがデプロイされると、名前の変更が失敗する] → 失敗してもエラーを表示するだけで、ほかの機能は動く。マイグレーションを先に当てる手順を tasks と PR に書く
- [オーナーが複数いる場合] → いまはオーナーはレシピノートを作った1人だけだが、どのオーナーも変えられる作りにしておく（`is_group_owner` の判定のまま）
