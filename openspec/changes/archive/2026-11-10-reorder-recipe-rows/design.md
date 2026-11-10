# Design

## Context

目的と範囲は proposal.md、求める動きは specs/recipes/spec.md を参照。ここでは、いまの作りのうち進め方に関わる点だけを書く。

- `RecipeForm.tsx` は react-hook-form の `useForm` を使い、材料と作り方を `watch('ingredients')`、`watch('steps')` で配列として読む。各行の入力欄は `register(\`ingredients.${index}\`)` で登録した非制御の入力欄
- 行の削除は、配列を作り直して `setValue('ingredients', next, { shouldDirty: true })` で丸ごと置き換えている。並び替えも同じやり方で入力欄の表示が追従する
- 2つの編集欄（`IngredientEditor.tsx`、`StepEditor.tsx`）は、行の `key` に添字（`ingredient-${index}`）を使っている。並び替えても DOM の行は入れ替わらず、中の値だけが変わる
- 2つの編集欄は `disabled` を受け取れるが、いまはどこからも渡していない。デモモードでもフォームの行の編集はでき、保存ボタンだけが無効になる
- フォームに変更がある（`isDirty`）と、画面を離れるときに確認が出る（`RecipeForm.tsx` の `beforeunload`）
- 行の削除ボタンは `editorStyles.ts` の `removeRowButtonClassName`（28px の四角）。作り方の行の左には、飾りの `GripVertical`（`aria-hidden`）がある
- 保存時は配列の順番のまま `ingredients` と `steps`（`text[]`）に保存される。ローカルプレビューの localStorage も同じ配列をそのまま持つ

## Goals / Non-Goals

**Goals:**

- 材料と作り方で、同じ移動ボタンの部品と同じ入れ替えの処理を使う
- 続けて押せるよう、移動の後のフォーカスの行き先を決めておく
- スマホの幅でも、入力欄が狭くなりすぎない並べ方にする

**Non-Goals:**

- react-hook-form の `useFieldArray` への書き換え（削除と追加のいまの作りに合わせ、変える範囲を小さくする）
- 行の `key` を添字から ID に変えること（値だけを入れ替える作りで足りるため）
- スキーマ、localStorage のデータ形式の変更（配列の順番がそのまま保存の順番になる）

## Decisions

### 1. 入れ替えは `RecipeForm` の1つの関数で行う

`RecipeForm` に、配列の名前（`'ingredients' | 'steps'`）と元の位置と移動先を受け取る関数を1つ足す。

```ts
const moveRow = (name: 'ingredients' | 'steps', from: number, to: number) => {
  const values = name === 'ingredients' ? ingredientValues : stepValues
  if (to < 0 || to >= values.length) return
  const next = [...values]
  ;[next[from], next[to]] = [next[to], next[from]]
  setValue(name, next, { shouldDirty: true })
}
```

- 編集欄には `onMove={(from, to) => moveRow('ingredients', from, to)}` の形で渡す
- `shouldDirty: true` で変更ありになり、画面を離れるときの確認も出る
- 範囲の外への移動は何もしない（ボタンを無効にしているが、念のため）

他の案: `useFieldArray` の `swap` を使う方法は、追加と削除もあわせて書き換えることになり、この変更の範囲を超えるので使わない。

### 2. 移動ボタンは共通の部品 `RowMoveButtons` にする

`src/features/recipes/components/RowMoveButtons.tsx` を新しく作り、2つの編集欄で使う。

```ts
type RowMoveButtonsProps = {
  label: '材料' | '手順' // 読み上げのラベルに使う
  index: number
  count: number
  onMove: (from: number, to: number) => void
  disabled?: boolean
}
```

- 上へ（lucide の `ChevronUp`）と下へ（`ChevronDown`）の2つの `button type="button"` を返す
- `aria-label` は「材料2を上へ移動」「手順3を下へ移動」（番号は `index + 1`）
- 先頭の行の上へ、末尾の行の下へは `disabled` にする。`count` が1のときは両方とも `disabled`
- 編集欄の `disabled` を受け取ったら、両方とも `disabled` にする（いまは渡していないが、削除ボタンと動きをそろえる）
- 見た目は削除ボタンと同じ 28px の四角にし、クラスは `editorStyles.ts` に `moveRowButtonClassName` として足す。ホバーは主色（`hover:bg-primary-soft hover:text-primary`）、無効のときは `disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted` とし、色は既存のトークンだけを使う

### 3. 移動の後のフォーカスは、移動先の行の同じ向きのボタンに移す

行の `key` が添字なので、移動しても押したボタンの DOM は元の行に残る。そこで、移動の後に移動先の行のボタンへフォーカスを移す。

- `RowMoveButtons` の各ボタンに `data-row-move="up|down"` と `data-row-index={index}` を付ける
- ボタンには `data-row-label="材料|手順"` も付け、再描画の後（`requestAnimationFrame`）に、ページの中から `[data-row-label="<材料|手順>"][data-row-index="<移動先>"][data-row-move="<向き>"]` を探してフォーカスする。材料と作り方で `data-row-label` が違うので、同じフォームの中でも取り違えない。この処理は `RowMoveButtons` の中に閉じ、編集欄には持たせない
- 移動先のその向きのボタンが無効になる場合（2行目を上へ移動して先頭になった、など）は、同じ行の反対の向きのボタンにフォーカスする。無効のボタンにはフォーカスできず、フォーカスがページの先頭に戻ってしまうため
- 仕様の「続けて移動」の場面（3行目を上へ2回）では、1回目の後は2行目の上へにフォーカスがあり、2回目で1行目に移ると上へが無効になるので、1行目の下へにフォーカスが移る

他の案: 行の `key` を ID にして DOM ごと入れ替え、押したボタンのフォーカスを保つ方法は、値の持ち方を変えることになり、この変更の範囲を超えるので使わない。

### 4. 行の並べ方（スマホ基準）

```
材料の行（スマホ 390px）
+------------------------------------------------+
| 01 [ 豚ロース薄切り 300g      ] [^] [v] [-]   |
+------------------------------------------------+

作り方の行
+------------------------------------------------+
| (1) [ 玉ねぎを薄切りにする    ] [^] [v] [-]   |
|     [                         ]               |
+------------------------------------------------+
```

- 入力欄の右に、上へ、下へ、削除の順に横に並べる（探索で決めたとおり）
- 3つのボタンの間は詰めて（`gap-0.5`）、入力欄との間はいまと同じ `gap-2.25` にする。ボタンの組を `flex flex-none` の1つの塊にする
- 作り方の行は、いまと同じく上に揃え（`items-start`）、ボタンの組に `mt-2` を付けて1行目の高さに合わせる
- 作り方の行の `GripVertical` は削除する。削除して空いた幅（約25px）は入力欄に回り、ボタンが2つ増えて減る幅（約60px）を一部取り戻す
- 「材料を追加」「手順を追加」のボタンの左の余白（`addRowButtonClassName` の `ml-8.75`）は、作り方の行の番号の位置に合わせたもの。つまみを消すと作り方の番号が左へ寄るので、行の左端と揃うか実装で確かめ、ずれる場合は値を合わせる
- PCでも同じ並べ方にする

## Risks / Trade-offs

- [スマホの幅（320px）で、ボタンが増えた分だけ入力欄が狭くなる] → 3つのボタンで約90px。320pxでも入力欄に150px前後が残る計算だが、実装の後に320pxと390pxで確かめる。狭すぎる場合はボタンの間をさらに詰める
- [押し間違いで削除ボタンを押しやすくなる] → 削除ボタンを右端に置き、移動のボタンと色（ホバーで赤と緑）で区別する。削除はいまと同じく確認なしだが、フォームの上の操作で保存前なので、取り消したい場合は画面を離れれば元に戻る
- [添字の `key` のまま値だけを入れ替えるので、入力中の文字の変換（IME）の途中で移動すると、変換中の文字が移動先に付いていかない可能性がある] → 移動はボタンを押す操作で、押した時点で入力欄からフォーカスが外れて変換が確定するため、実際には起きにくい。手動確認で日本語を入力した直後に移動して確かめる
- [`requestAnimationFrame` の後に要素を探すので、描画が遅れるとフォーカスが移らない] → 見つからない場合は何もしない（押したボタンにフォーカスが残る）。動きが崩れることはない
