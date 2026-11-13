import { ArrowRight, BookOpen, Search, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { Button } from '../components/Button'
import { PageLoader } from '../components/Loading'
import { alertErrorClassName } from '../components/styles'
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
  'px-4 pt-24 pb-12.5 sm:px-5 sm:pt-28 sm:pb-12',
  'lg:grid-cols-[minmax(0,520px)_470px] lg:justify-center lg:gap-x-18 lg:px-10 lg:pt-28 lg:pb-12',
  'before:absolute before:-top-61.25 before:-right-45 before:size-145 before:rounded-full before:border before:border-primary/12',
  'before:shadow-[0_0_0_48px_color-mix(in_srgb,var(--color-primary)_2.5%,transparent),0_0_0_96px_color-mix(in_srgb,var(--color-primary)_2.5%,transparent)]',
  'after:absolute after:-bottom-67.5 after:-left-52.5 after:size-140',
  'after:bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_10%,transparent),transparent_68%)]',
].join(' ')

const legalLinkClassName = 'text-text-muted underline underline-offset-2 hover:text-primary'

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

const featureIconClassName = 'grid size-11 place-items-center rounded-md bg-primary-soft text-primary'

const features = [
  { title: 'レシピ管理', description: 'レシピを登録・編集・削除', icon: <BookOpen size={22} /> },
  { title: '検索・絞り込み', description: '料理名やタグから素早く検索', icon: <Search size={22} /> },
  { title: 'レシピノートの共有', description: '家族やグループでレシピを共有', icon: <UsersRound size={22} /> },
  { title: 'Googleログイン', description: 'Googleアカウントで簡単にログイン', icon: <GoogleIcon size={22} /> },
]

export function LoginPage() {
  const {
    user,
    authReady,
    isDemoUser,
    signInWithGoogle,
    enterDemo,
  } = useApp()
  const location = useLocation()
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
      <BrandLockup variant="login" className="absolute top-5.5 left-5 z-1 sm:top-7.5 sm:left-9" />

      <main className="relative z-1 w-[min(470px,100%)] rounded-lg border border-border bg-white/96 px-5.5 py-7.5 shadow-md sm:p-10.5">
        <div>
          <h1 className="mb-2.5 text-28 font-bold tracking-[-.04em] text-text sm:text-30">レシピノートをひらく</h1>
          <p className="text-14 leading-[1.8] text-text-secondary">Googleアカウントでログインして、レシピノートをひらきます。</p>
        </div>

        <div className="mt-7.75">
          {displayedError ? <div className={alertErrorClassName} role="alert">{displayedError}</div> : null}
          <Button type="button" variant="secondary" size="xl" className="mt-4.25 w-full" loading={isSubmitting} onClick={() => void handleGoogleSignIn()}>
            {isSubmitting ? null : <GoogleIcon />} Googleでログイン
          </Button>
        </div>

        <div className="mt-10.5 flex items-center gap-3 text-12 text-text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border sm:mt-12"><span>はじめて使う方へ</span></div>
        <Link
          to="/recipes?demo=1"
          className="mt-3.25 flex items-center justify-center gap-1.25 text-13 font-bold text-primary"
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
        <h2 id="login-about-title" className="mb-3 font-bold text-text lg:mb-4">
          <span className="block text-17 leading-normal lg:text-26 lg:tracking-[-.03em]">レシピをもっと手軽に</span>
          <span className="block text-24 leading-[1.3] tracking-[-.03em] text-primary lg:text-38">管理・共有</span>
        </h2>
        <p>My Recipe は、お気に入りの料理レシピを簡単に保存・検索・共有できるWebアプリです。ネットで見つけたレシピや家庭の定番料理をひとつにまとめ、いつでも手軽に確認できます。</p>
        <h3 className="mt-5 mb-2 text-14 font-bold text-text">主な機能</h3>
        <ul className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {features.map(({ title, description, icon }) => (
            <li className="flex flex-col gap-1" key={title}>
              <span className={featureIconClassName}>{icon}</span>
              <strong className="mt-1 text-13 text-text">{title}</strong>
              <span className="text-12 leading-[1.6] text-text-secondary">{description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
