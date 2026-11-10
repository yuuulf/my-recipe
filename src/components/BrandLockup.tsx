import { Link } from 'react-router-dom'
import logoUrl from '../assets/logo.png'

type BrandLockupVariant = 'full' | 'compact' | 'header' | 'login'

type BrandLockupProps = {
  // full: sidebar. compact: invite and legal pages. header: mobile header.
  // login: the larger logo on the login page.
  variant?: BrandLockupVariant
  to?: string
  className?: string
}

const variantClassNames: Record<BrandLockupVariant, { root: string, logo: string, name: string }> = {
  full: { root: 'gap-2.5', logo: 'size-8', name: 'text-16' },
  compact: { root: 'gap-2', logo: 'size-7.5', name: 'text-16' },
  header: { root: 'gap-2', logo: 'size-7.5', name: 'text-15' },
  login: { root: 'gap-2.5 sm:gap-3', logo: 'size-9 sm:size-10', name: 'text-28 sm:text-30' },
}

export function BrandLockup({ variant = 'compact', to, className = '' }: BrandLockupProps) {
  const classNames = variantClassNames[variant]
  const rootClassName = `flex items-center text-text ${classNames.root} ${className}`.trim()

  const content = (
    <>
      <img src={logoUrl} alt="" className={`flex-none rounded-sm ${classNames.logo}`} />
      <strong className={`${classNames.name} font-bold tracking-[-.02em]`}>My Recipe</strong>
    </>
  )

  return to ? <Link to={to} className={rootClassName}>{content}</Link> : <div className={rootClassName}>{content}</div>
}
