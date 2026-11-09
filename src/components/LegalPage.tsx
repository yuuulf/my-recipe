import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from './BrandLockup'

type LegalPageProps = {
  title: string
  updatedAt: string
  children: ReactNode
}

// The body is plain HTML from each page, so its elements are styled from here.
// Preflight removes list bullets and heading weights, so they are set explicitly.
const legalBodyClassName = [
  'text-14 leading-[1.85] text-text-secondary',
  '[&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-16 [&_h2]:font-bold [&_h2]:text-text',
  '[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-[1.4em]',
  '[&_a]:font-bold [&_a]:text-primary',
].join(' ')

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-primary-soft px-4 pt-5.5 pb-10 sm:px-5 sm:pt-7 sm:pb-12">
      <header className="mx-auto mb-5.5 w-[min(720px,100%)]">
        <BrandLockup to="/login" />
      </header>
      <main className="mx-auto w-[min(720px,100%)] rounded-lg border border-border bg-surface px-5.5 py-7 shadow-md sm:px-10 sm:py-9">
        <Link to="/login" className="inline-flex items-center gap-1.25 text-13 font-bold text-primary"><ArrowLeft size={15} /> ログイン画面へ</Link>
        <h1 className="mt-4.5 mb-1.5 text-26 font-bold tracking-[-.03em] text-text">{title}</h1>
        <p className="mb-6.5 text-12 text-text-muted">最終更新日: {updatedAt}</p>
        <div className={legalBodyClassName}>{children}</div>
      </main>
    </div>
  )
}
