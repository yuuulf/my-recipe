import { ArrowRight, Check, Mail, ShieldCheck, Soup } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'

export function LoginPage() {
  const { user, signIn, isDemoMode } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const destination = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    if (!user) return
    if (destination) navigate(destination, { replace: true })
  }, [destination, navigate, user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await signIn(email, destination ?? '/recipes')
      if (result.magicLinkSent) {
        setMagicLinkSent(true)
        return
      }
      navigate(destination ?? '/', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'ログインできませんでした。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <div className="login-brand brand-lockup compact">
        <div className="brand-mark"><Soup size={19} /></div>
        <strong>MY RECIPE</strong>
      </div>

      <main className="login-card">
        <div className="login-heading">
          <h1>レシピ帳をひらく</h1>
          <p>メールアドレスを入力すると、ログイン用のリンクをお送りします。</p>
        </div>

        {magicLinkSent ? (
          <div className="magic-link-success">
            <div className="success-icon"><Check size={22} /></div>
            <h2>メールを確認してください</h2>
            <p><strong>{email}</strong> にログインリンクを送りました。メール内のリンクを開くとレシピ帳に入れます。</p>
            <button type="button" className="text-button" onClick={() => setMagicLinkSent(false)}>メールアドレスを変更</button>
          </div>
        ) : (
          <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="field-label" htmlFor="login-email">メールアドレス</label>
            <div className="input-with-icon">
              <Mail size={18} aria-hidden="true" />
              <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            {error ? <div className="alert error" role="alert">{error}</div> : null}
            <Button type="submit" className="full-width" loading={isSubmitting}>
              {isDemoMode ? 'デモモードでログイン' : 'ログインリンクを送る'} <ArrowRight size={17} />
            </Button>
            <div className="login-trust"><ShieldCheck size={15} /> パスワード不要 · 安全なマジックリンク認証</div>
          </form>
        )}

        <div className="login-divider"><span>はじめて使う方へ</span></div>
        <p className="login-signup-copy">ログイン後に、あなたのレシピ帳を作成できます。</p>
        <Link to="/recipes" className="demo-link">デモのレシピを見る <ArrowRight size={15} /></Link>
      </main>

      <p className="login-footer">あなたの料理の記録を、もっと身近に。</p>
    </div>
  )
}
