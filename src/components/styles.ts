// Class names for small parts shared by several screens. Outer layout (margins,
// order, width in a row) stays with the caller unless every caller uses the
// same value. Differences that would conflict with these classes are options.

export const alertErrorClassName =
  'my-3.5 rounded-md border border-danger/30 bg-danger-soft px-3.25 py-2.75 text-14 leading-[1.6] text-danger-text'

export const fieldLabelClassName =
  'mt-4.75 mb-2 flex items-center gap-1.25 text-14 font-bold text-text [&_svg]:text-text-secondary [&>span]:text-12 [&>span]:font-[450] [&>span]:text-text-muted'

export const requiredMarkClassName = "after:ml-px after:text-danger after:content-['*']"

export const fieldErrorClassName = 'mt-1.5 block text-12 text-danger'

type TextInputOptions = {
  error?: boolean
  // title: the recipe title field. tall: the group name field on the setup screen.
  // step: the recipe step textarea.
  size?: 'md' | 'title' | 'tall' | 'step'
  fullWidth?: boolean
}

const textInputSizeClassNames = {
  md: 'min-h-10.5 px-3 py-2.25 text-14',
  title: 'min-h-10.5 px-3.25 py-2.75 text-16',
  tall: 'min-h-12.5 px-3 py-2.25 text-15',
  step: 'min-h-13.25 px-3 py-2.25 text-14',
}

export const textInputClassName = ({ error = false, size = 'md', fullWidth = true }: TextInputOptions = {}) => [
  'resize-y rounded-md border bg-surface leading-[1.6] text-text outline-none',
  'transition-[border-color,box-shadow] duration-180 ease-[ease] focus:ring-3 focus:ring-primary/10',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-72',
  error ? 'border-danger/70' : 'border-border focus:border-primary',
  textInputSizeClassNames[size],
  fullWidth ? 'w-full' : '',
].join(' ').trim()

const tagBaseClassName = 'inline-flex min-h-6 items-center rounded-sm bg-primary-soft text-12 font-semibold text-primary-hover'

export const tagClassName = `${tagBaseClassName} px-2`

// A tag with a remove button, which needs less space on the right.
export const editableTagClassName = `${tagBaseClassName} gap-1.25 pr-1.25 pl-2`

export const tagRowClassName = 'flex flex-wrap gap-1.5'

type IconButtonOptions = {
  variant?: 'default' | 'muted' | 'danger'
  tall?: boolean
}

export const iconButtonClassName = ({ variant = 'default', tall = false }: IconButtonOptions = {}) => {
  const transition = 'transition-[color,border-color,background] duration-180 ease-[ease]'
  if (variant === 'muted') {
    return `inline-grid size-7.5 place-items-center rounded-md bg-transparent text-text-muted ${transition} hover:bg-primary-soft hover:text-primary`
  }
  const hover = variant === 'danger'
    ? 'hover:border-danger/45 hover:bg-danger-soft hover:text-danger'
    : 'hover:border-border-hover hover:bg-primary-soft hover:text-primary'
  return `inline-grid w-8.75 ${tall ? 'h-10.5' : 'h-8.75'} place-items-center rounded-md border border-border bg-surface text-text-secondary ${transition} ${hover}`
}

export const backLinkClassName =
  'inline-flex items-center gap-1.75 text-14 font-semibold text-text-secondary transition-[color] duration-180 ease-[ease] hover:text-primary'

// The bottom margin differs per screen, so callers add it.
export const pageHeaderClassName =
  'flex flex-col items-start justify-between gap-4.25 sm:flex-row sm:items-end sm:gap-7'

export const pageTitleClassName =
  'mt-2.25 mb-1.75 text-28 leading-[1.2] font-bold tracking-[-.035em] text-text sm:text-[clamp(26px,3vw,30px)]'
