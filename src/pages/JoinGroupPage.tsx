import { ArrowRight, Check, Link2, LoaderCircle, Soup, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import { getInviteGroup } from '../features/groups/api/groups'
import type { Group } from '../types/database'

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
    <div className="join-page">
      <div className="join-brand brand-lockup compact"><div className="brand-mark"><Soup size={19} /></div><strong>MY RECIPE</strong></div>
      <div className="join-card">
        <div className="join-card-art"><div className="join-art-circle"><UsersRound size={28} /></div><span className="join-art-line line-one" /><span className="join-art-line line-two" /></div>
        {loading ? <div className="join-loading"><LoaderCircle className="spin" size={26} /><p>招待リンクを確認しています…</p></div> : null}
        {!loading && error && !inviteGroup ? <div className="join-error"><div className="error-icon"><Link2 size={21} /></div><h1>招待リンクが無効です</h1><p>{error}</p><Link to="/login" className="button button-secondary">ログイン画面へ</Link></div> : null}
        {!loading && inviteGroup ? (
          <div className="join-copy">
            <span className="eyebrow">YOU ARE INVITED</span>
            <h1>「{inviteGroup.name}」に<br /><em>参加しますか？</em></h1>
            <p>このレシピ帳のメンバーになると、みんなのレシピを見たり、新しい料理を追加できます。</p>
            {error ? <div className="alert error" role="alert">{error}</div> : null}
            {user ? (
              <Button className="full-width join-button" loading={joining} onClick={() => void handleJoin()}>レシピ帳に参加する <ArrowRight size={17} /></Button>
            ) : (
              <Link to={loginPath} state={{ from: location.pathname }} className="button button-primary full-width join-button">ログインして参加する <ArrowRight size={17} /></Link>
            )}
            <div className="join-benefits"><span><Check size={14} /> レシピを閲覧・追加</span><span><Check size={14} /> メンバーと共有</span></div>
          </div>
        ) : null}
      </div>
      <p className="join-footer">あなたの料理の記録を、もっと身近に。</p>
    </div>
  )
}
