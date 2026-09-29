import { Check, Copy, Link2, LogOut, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { AppShell } from '../components/Layout/AppShell'
import { getMemberDisplayName, useApp } from '../contexts/app-context'

export function SettingsPage() {
  const { group, members, signOut, user, isDemoMode } = useApp()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const inviteUrl = group ? `${window.location.origin}/join/${group.invite_token}` : ''

  const copyInviteLink = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell>
      <div className="page-header settings-header">
        <div>
          <span className="eyebrow">設定</span>
          <h1>グループ設定</h1>
          <p>レシピ帳を一緒に使うメンバーを管理します。</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card group-card">
          <div className="settings-card-heading"><div className="settings-card-icon orange"><UsersRound size={19} /></div><div><span className="eyebrow">グループ情報</span><h2>{group?.name}</h2></div></div>
          <div className="group-card-divider" />
          <div className="group-detail-row"><span>オーナー</span><strong>{members.find((member) => member.role === 'owner') ? getMemberDisplayName(members.find((member) => member.role === 'owner')!, user) : user?.displayName}</strong></div>
          <div className="group-detail-row"><span>メンバー数</span><strong>{members.length}人</strong></div>
          {isDemoMode ? <p className="settings-footnote"><ShieldCheck size={14} /> ローカルプレビューのデータはこのブラウザに保存されます。</p> : null}
        </section>

        <section className="settings-card members-card">
          <div className="settings-card-heading"><div className="settings-card-icon blue"><UserRound size={19} /></div><div><span className="eyebrow">参加者</span><h2>メンバー</h2></div><span className="member-count">{members.length}</span></div>
          <div className="member-list">
            {members.map((member) => (
              <div className="member-row" key={`${member.group_id}-${member.user_id}`}>
                <div className="member-avatar">{getMemberDisplayName(member, user).slice(0, 1)}</div>
                <div className="member-copy"><strong>{getMemberDisplayName(member, user)}</strong><span>{member.user_id === user?.id ? 'あなた' : 'メンバー'}</span></div>
                <span className={`role-pill ${member.role}`}>{member.role === 'owner' ? 'owner' : 'member'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-card invite-card">
          <div className="settings-card-heading"><div className="settings-card-icon green"><Link2 size={19} /></div><div><span className="eyebrow">招待</span><h2>メンバーを招待</h2></div></div>
          <p>このリンクを知っている人は、ログイン後にレシピ帳へ参加できます。</p>
          <div className="invite-link-box"><Link2 size={16} /><span>{inviteUrl}</span></div>
          <Button variant="secondary" className="copy-button" onClick={() => void copyInviteLink()}>{copied ? <><Check size={16} /> コピーしました</> : <><Copy size={16} /> 招待リンクをコピー</>}</Button>
        </section>
      </div>

      <section className="settings-danger-zone">
        <div><span className="eyebrow">アカウント</span><h2>アカウント</h2><p>{user?.email}</p></div>
        <Button variant="ghost" onClick={() => void handleSignOut()}><LogOut size={16} /> ログアウト</Button>
      </section>
    </AppShell>
  )
}
