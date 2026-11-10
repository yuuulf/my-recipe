// Class names shared by IngredientEditor and StepEditor.

export const editorListClassName = 'grid gap-2.25'

// The move up, move down and remove buttons at the end of a row.
export const rowActionsClassName = 'flex flex-none items-center gap-0.5'

export const removeRowButtonClassName =
  'grid size-7 flex-none place-items-center rounded-sm bg-transparent text-text-muted hover:bg-danger-soft hover:text-danger'

export const moveRowButtonClassName = [
  'grid size-7 flex-none place-items-center rounded-sm bg-transparent text-text-muted hover:bg-primary-soft hover:text-primary',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted',
].join(' ')

export const addRowButtonClassName =
  'mt-1 ml-8.75 inline-flex items-center gap-1.5 justify-self-start bg-transparent py-1.25 text-14 font-bold text-primary hover:text-primary-hover'
