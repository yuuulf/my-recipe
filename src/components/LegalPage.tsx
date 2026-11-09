import { ArrowLeft, Soup } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type LegalPageProps = {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/login" className="brand-lockup compact">
          <div className="brand-mark"><Soup size={19} /></div>
          <strong>MY RECIPE</strong>
        </Link>
      </header>
      <main className="legal-card">
        <Link to="/login" className="legal-back"><ArrowLeft size={15} /> ログイン画面へ</Link>
        <h1>{title}</h1>
        <p className="legal-updated">最終更新日: {updatedAt}</p>
        <div className="legal-body">{children}</div>
      </main>
    </div>
  )
}
