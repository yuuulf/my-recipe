// Recipe note names are 1 to 50 characters after trimming. The server enforces
// the same limit: keep in sync with create_group and rename_group in
// supabase/migrations/.
export const RECIPE_NOTE_NAME_MAX = 50

export const recipeNoteNameError = 'レシピノートの名前は1〜50文字にしてください。'
