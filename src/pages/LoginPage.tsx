import { ArrowRight, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { alertErrorClassName, fieldLabelClassName } from '../components/styles'
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

// Background: a ringed circle at the top right and a soft glow at the bottom left.
const loginPageClassName = [
  'relative grid min-h-screen place-items-center content-center overflow-hidden bg-primary-soft',
  'px-4 pt-20.5 pb-12.5 sm:px-5 sm:pt-18 sm:pb-12',
  'lg:grid-cols-[minmax(0,460px)_470px] lg:justify-center lg:gap-x-18 lg:px-10 lg:pt-20 lg:pb-12',
  'before:absolute before:-top-61.25 before:-right-45 before:size-145 before:rounded-full before:border before:border-primary/12',
  'before:shadow-[0_0_0_48px_color-mix(in_srgb,var(--color-primary)_2.5%,transparent),0_0_0_96px_color-mix(in_srgb,var(--color-primary)_2.5%,transparent)]',
  'after:absolute after:-bottom-67.5 after:-left-52.5 after:size-140',
  'after:bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_10%,transparent),transparent_68%)]',
].join(' ')

const legalLinkClassName = 'text-text-muted underline underline-offset-2 hover:text-primary'

function GoogleIcon() {
  return (
    <svg className="shrink-0" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
    <div className={loginPageClassName}>
      <div className="absolute top-[17%] -left-36.25 z-0 size-62.5 rounded-full border border-primary/10" aria-hidden="true" />
      <div className="absolute right-[7%] bottom-[12%] z-0 size-47.5 rounded-full border border-primary/10 opacity-70" aria-hidden="true" />
      <BrandLockup className="absolute top-5.5 left-5 z-1 sm:top-7.5 sm:left-9" />

      <main className="relative z-1 w-[min(470px,100%)] rounded-lg border border-border bg-white/96 px-5.5 py-7.5 shadow-md sm:p-10.5">
        <div>
          <h1 className="mb-2.5 text-28 font-bold tracking-[-.04em] text-text sm:text-30">レシピ帳をひらく</h1>
          <p className="text-14 leading-[1.8] text-text-secondary">{isDemoMode ? 'ローカルプレビューです。メールアドレスを入力すると、このブラウザですぐにログインできます。' : 'Googleアカウントでログインして、レシピ帳をひらきます。'}</p>
        </div>

        {isDemoMode ? (
          <form className="mt-7.75" onSubmit={(event) => void handleSubmit(event)}>
            <label className={fieldLabelClassName} htmlFor="login-email">メールアドレス</label>
            <div className="flex items-center gap-2.25 rounded-md border border-border px-3.25 text-text-muted focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/10">
              <Mail size={18} aria-hidden="true" />
              <input id="login-email" className="min-h-11.5 w-full border-0 bg-transparent text-14 text-text outline-none" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
            <Button type="submit" className="mt-4.25 w-full" loading={isSubmitting}>
              ログイン <ArrowRight size={17} />
            </Button>
          </form>
        ) : (
          <div className="mt-7.75">
            {displayedError ? <div className={alertErrorClassName} role="alert">{displayedError}</div> : null}
            <Button type="button" variant="secondary" size="xl" className="mt-4.25 w-full" loading={isSubmitting} onClick={() => void handleGoogleSignIn()}>
              {isSubmitting ? null : <GoogleIcon />} Googleでログイン
            </Button>
          </div>
        )}

        <div className="mt-10.5 flex items-center gap-3 text-12 text-text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border sm:mt-12"><span>はじめて使う方へ</span></div>
        <p className="mt-3.25 mb-3 text-center text-13 text-text-muted">ログイン後に、あなたのレシピ帳を作成できます。</p>
        <Link
          to="/recipes?demo=1"
          className="flex items-center justify-center gap-1.25 text-13 font-bold text-primary"
          onClick={() => enterDemo()}
        >
          デモのレシピを見る <ArrowRight size={15} />
        </Link>
        <nav className="mt-6.5 flex justify-center gap-2 text-12 text-text-muted" aria-label="規約">
          <Link to="/privacy" className={legalLinkClassName}>プライバシーポリシー</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms" className={legalLinkClassName}>利用規約</Link>
        </nav>
      </main>

      <section className="relative z-1 mt-10 w-[min(470px,100%)] px-1 text-14 leading-[1.8] text-text-secondary lg:order-first lg:mt-0 lg:w-auto lg:px-0" aria-labelledby="login-about-title">
        <h2 id="login-about-title" className="mb-3 text-17 leading-normal font-bold text-text lg:mb-4 lg:text-26 lg:tracking-[-.03em]">My Recipe｜レシピをもっと手軽に管理・共有</h2>
        <p>My Recipe は、お気に入りの料理レシピを簡単に保存・検索・共有できるWebアプリです。ネットで見つけたレシピや家庭の定番料理をひとつにまとめ、いつでも手軽に確認できます。</p>
        <h3 className="mt-5 mb-2 text-14 font-bold text-text">主な機能</h3>
        <ul className="mb-5 grid gap-2 [&_li]:grid [&_li]:gap-0.5 lg:[&_li]:grid-cols-[7.5em_1fr] lg:[&_li]:gap-3 [&_strong]:text-13 [&_strong]:text-primary">
          <li><strong>レシピ管理</strong>料理名・材料・作り方を登録、編集、削除</li>
          <li><strong>検索・絞り込み</strong>料理名やタグからレシピを簡単に検索</li>
          <li><strong>グループ共有</strong>家族やグループでお気に入りのレシピを共有</li>
          <li><strong>Googleログイン</strong>Googleアカウントで簡単にログイン</li>
        </ul>
      </section>

      <p className="absolute bottom-2.5 z-1 hidden text-12 text-text-muted italic sm:block">あなたの料理の記録を、もっと身近に。</p>
    </div>
  )
}
