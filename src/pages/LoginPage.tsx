import { ArrowRight, Mail, Soup } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'

const isAppPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\')

const hasAuthError = (search: string, hash: string) => {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(search)
  return ['error', 'error_code', 'error_description'].some(
    (key) => searchParams.has(key) || hashParams.has(key),
  )
}

function GoogleIcon() {
  return (
    <svg className="google-icon" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function LoginPage() {
  const {
    user,
    authReady,
    isDemoUser,
    signInWithGoogle,
    signInLocal,
    isDemoMode,
    enterDemo,
  } = useApp()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const googleSignInStartedRef = useRef(false)
  const [searchParams] = useSearchParams()
  const destination = [
    (location.state as { from?: unknown } | null)?.from,
    searchParams.get('returnTo'),
  ].find(isAppPath)
  const urlError = hasAuthError(location.search, location.hash)
    ? 'Googleでログインできませんでした。もう一度お試しください。'
    : ''
  const displayedError = error || urlError

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !googleSignInStartedRef.current) return
      googleSignInStartedRef.current = false
      setIsSubmitting(false)
      setError('ログインが完了しませんでした。もう一度お試しください。')
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signInLocal(email)
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'ログインできませんでした。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsSubmitting(true)
    googleSignInStartedRef.current = true
    try {
      await signInWithGoogle(destination)
    } catch (signInError) {
      googleSignInStartedRef.current = false
      setError(getErrorMessage(signInError, 'Googleログインを開始できませんでした。'))
      setIsSubmitting(false)
    }
  }

  if (!authReady) return <PageLoader />
  if (user && !isDemoUser && !isSubmitting) {
    return <Navigate to={destination ?? '/'} replace />
  }

  return (
    <div className="login-page">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <div className="login-brand brand-lockup compact">
        <div className="brand-mark"><Soup size={19} /></div>
        <strong>My Recipe</strong>
      </div>

      <main className="login-card">
        <div className="login-heading">
          <h1>レシピ帳をひらく</h1>
          <p>{isDemoMode ? 'ローカルプレビューです。メールアドレスを入力すると、このブラウザですぐにログインできます。' : 'Googleアカウントでログインして、レシピ帳をひらきます。'}</p>
        </div>

        {isDemoMode ? (
          <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="field-label" htmlFor="login-email">メールアドレス</label>
            <div className="input-with-icon">
              <Mail size={18} aria-hidden="true" />
              <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            {error ? <div className="alert error" role="alert">{error}</div> : null}
            <Button type="submit" className="full-width" loading={isSubmitting}>
              ログイン <ArrowRight size={17} />
            </Button>
          </form>
        ) : (
          <div className="login-form">
            {displayedError ? <div className="alert error" role="alert">{displayedError}</div> : null}
            <Button type="button" variant="secondary" className="full-width google-button" loading={isSubmitting} onClick={() => void handleGoogleSignIn()}>
              {isSubmitting ? null : <GoogleIcon />} Googleでログイン
            </Button>
          </div>
        )}

        <div className="login-divider"><span>はじめて使う方へ</span></div>
        <p className="login-signup-copy">ログイン後に、あなたのレシピ帳を作成できます。</p>
        <Link
          to="/recipes?demo=1"
          className="demo-link"
          onClick={() => enterDemo()}
        >
          デモのレシピを見る <ArrowRight size={15} />
        </Link>
        <nav className="login-legal" aria-label="規約">
          <Link to="/privacy">プライバシーポリシー</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms">利用規約</Link>
        </nav>
      </main>

      <section className="login-about" aria-labelledby="login-about-title">
        <h2 id="login-about-title">My Recipe｜レシピをもっと手軽に管理・共有</h2>
        <p>My Recipe は、お気に入りの料理レシピを簡単に保存・検索・共有できるWebアプリです。ネットで見つけたレシピや家庭の定番料理をひとつにまとめ、いつでも手軽に確認できます。</p>
        <h3>主な機能</h3>
        <ul>
          <li><strong>レシピ管理</strong>料理名・材料・作り方を登録、編集、削除</li>
          <li><strong>検索・絞り込み</strong>料理名やタグからレシピを簡単に検索</li>
          <li><strong>グループ共有</strong>家族やグループでお気に入りのレシピを共有</li>
          <li><strong>Googleログイン</strong>Googleアカウントで簡単にログイン</li>
        </ul>
      </section>

      <p className="login-footer">あなたの料理の記録を、もっと身近に。</p>
    </div>
  )
}
