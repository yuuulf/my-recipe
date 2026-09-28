import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    loading?: boolean
  }
>

export function Button({
  children,
  className = '',
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
