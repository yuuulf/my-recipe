import { ArrowRight, Check, Link2, LoaderCircle, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { Button } from '../components/Button'
import { buttonClassName } from '../components/buttonStyles'
import { alertErrorClassName, eyebrowClassName } from '../components/styles'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getInviteGroup } from '../features/groups/api/groups'
import type { Group } from '../types/database'

// The two thin lines on either side of the icon at the top of the card.
const artLineClassName = 'absolute top-7 h-px w-18.5 bg-primary/20'

export function JoinGroupPage() {
  const { token } = useParams<{ token: string }>()
  const { user, joinGroup } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [inviteGroup, setInviteGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('招待リンクが不正です。')
      setLoading(false)
      return
    }
    let active = true
    void getInviteGroup(token)
      .then((group) => {
        if (active) setInviteGroup(group)
      })
      .catch((loadError: unknown) => { if (active) setError(getErrorMessage(loadError, '招待リンクを確認できませんでした。')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const handleJoin = async () => {
    if (!token) return
    setJoining(true)
    setError('')
    try {
      await joinGroup(token)
      navigate('/recipes', { replace: true })
    } catch (joinError) {
      setError(getErrorMessage(joinError, 'グループに参加できませんでした。'))
    } finally {
      setJoining(false)
    }
  }

  const loginPath = `/login?returnTo=${encodeURIComponent(location.pathname)}`

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-5 py-7.5">
      <BrandLockup className="absolute top-5.5 left-5 sm:top-7.5 sm:left-9" />
      <div className="relative mt-6.25 w-full max-w-118.75 rounded-lg border border-border bg-surface px-5.5 pt-7 pb-7.75 text-center shadow-md sm:mt-5.75 sm:px-11.25 sm:pt-8.5 sm:pb-9.75">
        <div className="relative mb-4.75 h-17.25">
          <div className="relative z-1 mx-auto grid size-14.5 place-items-center rounded-full bg-primary-soft text-primary"><UsersRound size={28} /></div>
          <span className={`${artLineClassName} left-6.25 rotate-23`} />
          <span className={`${artLineClassName} right-6.25 -rotate-23`} />
        </div>
        {loading ? (
          <div className="py-5.75 text-14 text-text-secondary">
            <LoaderCircle className="inline animate-spin align-baseline text-primary" size={26} />
            <p className="mt-3">招待リンクを確認しています…</p>
          </div>
        ) : null}
        {!loading && error && !inviteGroup ? (
          <div className="py-3.25">
            <div className="mx-auto mb-3.25 grid size-10.75 place-items-center rounded-md bg-danger-soft text-danger"><Link2 size={21} /></div>
            <h1 className="mb-2 text-24 font-bold text-text">招待リンクが無効です</h1>
            <p className="mb-4.75 text-14 text-text-secondary">{error}</p>
            <Link to="/login" className={buttonClassName('secondary')}>ログイン画面へ</Link>
          </div>
        ) : null}
        {!loading && inviteGroup ? (
          <div>
            <span className={eyebrowClassName}>YOU ARE INVITED</span>
            <h1 className="mt-3 mb-3.25 text-28 leading-[1.3] font-bold tracking-[-.045em] text-text sm:text-30">「{inviteGroup.name}」に<br /><em className="text-primary not-italic">参加しますか？</em></h1>
            <p className="text-14 leading-[1.85] text-text-secondary">このレシピ帳のメンバーになると、みんなのレシピを見たり、新しい料理を追加できます。</p>
            {error ? <div className={alertErrorClassName} role="alert">{error}</div> : null}
            {user ? (
              <Button size="lg" className="mt-6 w-full" loading={joining} onClick={() => void handleJoin()}>レシピ帳に参加する <ArrowRight size={17} /></Button>
            ) : (
              <Link to={loginPath} state={{ from: location.pathname }} className={buttonClassName('primary', 'mt-6 w-full', 'lg')}>ログインして参加する <ArrowRight size={17} /></Link>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-12 text-text-muted">
              <span className="inline-flex items-center gap-1"><Check className="text-primary" size={14} /> レシピを閲覧・追加</span>
              <span className="inline-flex items-center gap-1"><Check className="text-primary" size={14} /> メンバーと共有</span>
            </div>
          </div>
        ) : null}
      </div>
      <p className="absolute bottom-7.5 hidden text-12 text-text-muted italic sm:block">あなたの料理の記録を、もっと身近に。</p>
    </div>
  )
}
