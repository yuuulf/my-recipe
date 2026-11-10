import { Check, Copy, Link2, LogOut, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { AppShell } from '../components/Layout/AppShell'
import { eyebrowClassName, pageHeaderClassName, pageLeadClassName, pageTitleClassName } from '../components/styles'
import { getMemberDisplayName, useApp } from '../contexts/app-context'

const cardClassName = 'min-w-0 rounded-lg border border-border bg-surface p-4.75 shadow-sm sm:p-5.5'
const cardHeadingClassName = 'flex items-center gap-2.75'
const cardIconClassName = (tone: 'primary' | 'info' = 'primary') =>
  `grid size-9 place-items-center rounded-md ${tone === 'info' ? 'bg-info-soft text-info' : 'bg-primary-soft text-primary'}`
const cardTitleClassName = 'mt-1 text-18 font-bold tracking-[-.025em] text-text'
const detailRowClassName = 'flex justify-between gap-4.5 py-1.75 text-13 text-text-secondary [&>strong]:font-bold [&>strong]:text-text'
const footnoteClassName = 'mt-4.5 flex gap-1.5 text-12 leading-[1.6] text-text-muted'
const inviteLinkBoxClassName = 'flex min-w-0 items-center gap-2 rounded-sm border border-border bg-surface-muted px-3 py-2.75 font-mono text-12 text-text-secondary'

export function SettingsPage() {
  const { group, members, signOut, user, isDemoMode, isDemoUser } = useApp()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const inviteUrl = isDemoUser
    ? `${window.location.origin}/login`
    : group
      ? `${window.location.origin}/join/${group.invite_token}`
      : ''

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
      <div className={`${pageHeaderClassName} mb-6.75 md:mb-7`}>
        <div>
          <span className={eyebrowClassName}>設定</span>
          <h1 className={pageTitleClassName}>グループ設定</h1>
          <p className={pageLeadClassName}>レシピ帳を一緒に使うメンバーを管理します。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className={cardClassName}>
          <div className={cardHeadingClassName}><div className={cardIconClassName()}><UsersRound size={19} /></div><div><span className={eyebrowClassName}>グループ情報</span><h2 className={cardTitleClassName}>{group?.name}</h2></div></div>
          <div className="mt-5.5 mb-3.25 h-px bg-border" />
          <div className={detailRowClassName}><span>オーナー</span><strong>{members.find((member) => member.role === 'owner') ? getMemberDisplayName(members.find((member) => member.role === 'owner')!, user) : user?.displayName}</strong></div>
          <div className={detailRowClassName}><span>メンバー数</span><strong>{members.length}人</strong></div>
          {isDemoUser ? <p className={footnoteClassName}><ShieldCheck size={14} /> デモ用の固定データを表示しています。</p> : null}
          {!isDemoUser && isDemoMode ? <p className={footnoteClassName}><ShieldCheck size={14} /> ローカルプレビューのデータはこのブラウザに保存されます。</p> : null}
        </section>

        <section className={cardClassName}>
          <div className={cardHeadingClassName}><div className={cardIconClassName('info')}><UserRound size={19} /></div><div><span className={eyebrowClassName}>参加者</span><h2 className={cardTitleClassName}>メンバー</h2></div><span className="ml-auto min-w-6.5 rounded-full bg-primary-soft px-1.75 py-0.75 text-center text-12 text-primary-hover">{members.length}</span></div>
          <div className="mt-5 grid gap-1.5">
            {members.map((member) => (
              <div className="flex items-center gap-2.5 border-t border-surface-muted py-2.25" key={`${member.group_id}-${member.user_id}`}>
                <div className="grid size-7.5 place-items-center rounded-full bg-primary-soft text-12 font-extrabold text-primary">{getMemberDisplayName(member, user).slice(0, 1)}</div>
                <div className="flex min-w-0 flex-1 flex-col"><strong className="truncate text-13 text-text">{getMemberDisplayName(member, user)}</strong><span className="text-12 text-text-muted">{member.user_id === user?.id ? 'あなた' : 'メンバー'}</span></div>
                <span className={`rounded-sm px-2 py-1 text-11 ${member.role === 'owner' ? 'bg-primary-soft text-primary-hover' : 'bg-surface-muted text-text-secondary'}`}>{member.role === 'owner' ? 'owner' : 'member'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${cardClassName} col-span-full`}>
          <div className={cardHeadingClassName}><div className={cardIconClassName()}><Link2 size={19} /></div><div><span className={eyebrowClassName}>招待</span><h2 className={cardTitleClassName}>メンバーを招待</h2></div></div>
          <p className="mt-4 mb-3.25 text-14 leading-[1.6] text-text-secondary">{isDemoUser ? 'デモでは、メンバー招待のリンクからログイン画面を案内します。' : 'このリンクを知っている人は、ログイン後にレシピ帳へ参加できます。'}</p>
          {isDemoUser ? (
            <a href={inviteUrl} className={`${inviteLinkBoxClassName} hover:border-border-hover hover:text-primary-hover`}><Link2 className="flex-none text-primary" size={16} /><span className="truncate">{inviteUrl}</span></a>
          ) : (
            <div className={inviteLinkBoxClassName}><Link2 className="flex-none text-primary" size={16} /><span className="truncate">{inviteUrl}</span></div>
          )}
          <Button variant="secondary" className="mt-3" onClick={() => void copyInviteLink()}>{copied ? <><Check size={16} /> コピーしました</> : <><Copy size={16} /> 招待リンクをコピー</>}</Button>
        </section>
      </div>

      <section className="mt-8.75 flex flex-col items-start justify-between gap-5 border-t border-border px-1 py-5.25 sm:flex-row sm:items-center">
        <div><span className={eyebrowClassName}>アカウント</span><h2 className="mt-1 mb-0.5 text-16 font-bold text-text">アカウント</h2><p className="text-13 text-text-muted">{user?.email}</p></div>
        <Button variant="ghost" onClick={() => void handleSignOut()}><LogOut size={16} /> ログアウト</Button>
      </section>
    </AppShell>
  )
}
