import { Soup } from 'lucide-react'
import { Link } from 'react-router-dom'

type BrandLockupProps = {
  // full: sidebar with subtitle. compact: logo and name only.
  // header: compact with a slightly smaller name for the mobile header.
  variant?: 'full' | 'compact' | 'header'
  to?: string
  className?: string
}

export function BrandLockup({ variant = 'compact', to, className = '' }: BrandLockupProps) {
  const isFull = variant === 'full'
  const rootClassName = `flex items-center text-text ${isFull ? 'gap-2.5' : 'gap-2'} ${className}`.trim()
  const nameClassName = `${variant === 'header' ? 'text-15' : 'text-16'} font-bold tracking-[-.02em]`

  const content = (
    <>
      <div className={`grid flex-none place-items-center rounded-md bg-primary text-white ${isFull ? 'size-8' : 'size-7.5'}`} aria-hidden="true">
        {isFull ? <Soup size={21} strokeWidth={2.4} /> : <Soup size={19} />}
      </div>
      {isFull ? (
        <div className="flex flex-col leading-[1.15]">
          <strong className={nameClassName}>My Recipe</strong>
          <span className="mt-1 text-11 text-text-muted">レシピ管理</span>
        </div>
      ) : (
        <strong className={nameClassName}>My Recipe</strong>
      )}
    </>
  )

  return to ? <Link to={to} className={rootClassName}>{content}</Link> : <div className={rootClassName}>{content}</div>
}
