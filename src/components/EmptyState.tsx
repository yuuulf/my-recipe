import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  // An action such as a button or link below the description.
  children?: ReactNode
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-70 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface p-7.5 text-center">
      <div className="grid size-12.5 place-items-center rounded-lg bg-primary-soft text-primary">{icon}</div>
      <h2 className="mt-4 mb-1.5 text-18 font-bold text-text">{title}</h2>
      <p className="mb-5 max-w-82.5 text-14 leading-[1.7] text-text-secondary">{description}</p>
      {children}
    </div>
  )
}
