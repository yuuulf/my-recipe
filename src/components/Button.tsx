import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
  }
>

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className, size)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="size-3.5 animate-spin-fast rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
