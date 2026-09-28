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
      <div className="login-showcase">
        <div className="showcase-topline">
          <div className="brand-lockup light compact">
            <div className="brand-mark"><Soup size={20} /></div>
            <strong>KITCHEN NOTE</strong>
          </div>
          <span className="showcase-badge">YOUR SHARED RECIPE BOOK</span>
        </div>
        <div className="showcase-copy">
          <span className="eyebrow light-text">COOK · SHARE · REMEMBER</span>
          <h1>いつもの料理を、<br /><em>みんなの記録</em>に。</h1>
          <p>家族の定番料理も、ふと思いついたレシピも。<br />大切な人と一緒に育てるレシピ帳です。</p>
        </div>
        <div className="showcase-cards" aria-hidden="true">
          <div className="floating-recipe-card card-back">
            <span>RECENTLY ADDED</span>
            <strong>春野菜のパスタ</strong>
            <small>春の味覚 · 25分</small>
          </div>
          <div className="floating-recipe-card card-front">
            <span>FAMILY FAVORITE</span>
            <strong>豚の生姜焼き</strong>
            <small>夕食 · 20分 · 2人分</small>
            <div className="fake-tags"><i>#定番</i><i>#簡単</i></div>
          </div>
        </div>
        <div className="showcase-footer">A place for recipes worth making again.</div>
      </div>

      <div className="login-panel">
        <div className="login-panel-inner">
          <div className="mobile-login-brand brand-lockup compact">
            <div className="brand-mark"><Soup size={19} /></div>
            <strong>KITCHEN NOTE</strong>
          </div>
          <div className="login-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>レシピ帳をひらく</h2>
            <p>メールアドレスを入力すると、ログイン用のリンクをお送りします。</p>
          </div>

          {magicLinkSent ? (
            <div className="magic-link-success">
              <div className="success-icon"><Check size={22} /></div>
              <h3>メールを確認してください</h3>
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
        </div>
        <div className="login-panel-bottom">© {new Date().getFullYear()} Kitchen Note</div>
      </div>
    </div>
  )
}
