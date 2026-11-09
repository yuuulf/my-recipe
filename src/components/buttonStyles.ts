export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

// md: default. compact: md with narrower sides at 640px and below (recipe detail toolbar).
// compact-short: also shorter at 640px and below (recipe form top bar).
// lg: taller call to action. xl: the Google sign-in button.
export type ButtonSize = 'md' | 'compact' | 'compact-short' | 'lg' | 'xl'

const baseClassName =
  'inline-flex items-center justify-center rounded-md border font-bold transition-[background,color,border-color,transform,translate,box-shadow] duration-180 ease-[ease] disabled:cursor-not-allowed disabled:opacity-62'

const sizeClassNames: Record<ButtonSize, string> = {
  md: 'min-h-10.5 gap-2 px-4 text-14',
  compact: 'min-h-10.5 gap-2 px-2.75 text-14 sm:px-4',
  'compact-short': 'min-h-9.5 gap-2 px-3 text-14 sm:min-h-10.5 sm:px-4',
  lg: 'min-h-12 gap-2 px-4 text-14',
  xl: 'min-h-12.5 gap-2.5 px-4 text-15',
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-white shadow-button hover:not-disabled:-translate-y-px hover:not-disabled:bg-primary-hover hover:not-disabled:shadow-button-hover',
  secondary:
    'border-border-strong bg-surface text-text hover:not-disabled:border-border-hover hover:not-disabled:bg-surface-muted hover:not-disabled:text-primary-hover',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:not-disabled:bg-surface-muted hover:not-disabled:text-text',
  danger:
    'border-transparent bg-danger text-white hover:not-disabled:bg-danger-hover',
}

// Shared by <Button> and by links that look like buttons.
export const buttonClassName = (variant: ButtonVariant = 'primary', className = '', size: ButtonSize = 'md') =>
  `${baseClassName} ${sizeClassNames[size]} ${variantClassNames[variant]} ${className}`.trim()
