import { Check, Copy, DoorOpen, Link2, LogOut, ShieldCheck, UserMinus, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { AppShell } from '../components/Layout/AppShell'
import { eyebrowClassName, iconButtonClassName, pageHeaderClassName, pageLeadClassName, pageTitleClassName } from '../components/styles'
import { getMemberDisplayName, useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'
import type { GroupMember } from '../types/database'
import { RecipeNoteNameHeading } from '../features/groups/components/RecipeNoteNameHeading'

const cardClassName = 'min-w-0 rounded-lg border border-border bg-surface p-4.75 shadow-sm sm:p-5.5'
const cardHeadingClassName = 'flex items-center gap-2.75'
const cardIconClassName = (tone: 'primary' | 'info' = 'primary') =>
  `grid size-9 place-items-center rounded-md ${tone === 'info' ? 'bg-info-soft text-info' : 'bg-primary-soft text-primary'}`
const cardTitleClassName = 'text-18 font-bold tracking-[-.025em] text-text'
const detailRowClassName = 'flex justify-between gap-4.5 py-1.75 text-13 text-text-secondary [&>strong]:font-bold [&>strong]:text-text'
const footnoteClassName = 'mt-4.5 flex gap-1.5 text-12 leading-[1.6] text-text-muted'
const inviteLinkBoxClassName = 'flex min-w-0 items-center gap-2 rounded-sm border border-border bg-surface-muted px-3 py-2.75 font-mono text-12 text-text-secondary'

export function SettingsPage() {
  const { group, members, membersLoading, signOut, user, isDemoUser, removeMember, leaveGroup } = useApp()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  // The member the owner chose to remove, while the confirmation is open.
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')
  const isOwner = members.some((member) => member.user_id === user?.id && member.role === 'owner')
  // An owner may leave only when alone, and leaving then deletes the note.
  const ownerAlone = isOwner && members.length === 1
  const ownerWithOthers = isOwner && members.length > 1
  const owner = members.find((member) => member.role === 'owner')
  // Until the members are loaded, the owner and the count are unknown.
  const ownerName = membersLoading ? '…' : owner ? getMemberDisplayName(owner, user) : 'メンバー'
  const memberCount = membersLoading ? '…' : `${members.length}人`
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

  // Only the owner, outside the demo, may remove members other than herself.
  const canRemove = (member: GroupMember) => isOwner && !isDemoUser && member.user_id !== user?.id

  const closeRemoveConfirm = () => {
    setMemberToRemove(null)
    setRemoveError('')
  }

  const handleRemove = async () => {
    if (!group || !memberToRemove) return
    setRemoving(true)
    setRemoveError('')
    try {
      await removeMember(group.id, memberToRemove.user_id)
      setMemberToRemove(null)
    } catch (error) {
      setRemoveError(getErrorMessage(error, 'メンバーを外せませんでした。'))
    } finally {
      setRemoving(false)
    }
  }

  const closeLeaveConfirm = () => {
    setShowLeaveConfirm(false)
    setLeaveError('')
  }

  const handleLeave = async () => {
    if (!group) return
    setLeaving(true)
    setLeaveError('')
    try {
      await leaveGroup(group.id)
      // Another note opens, or the setup page when none is left.
      navigate('/recipes', { replace: true })
    } catch (error) {
      setLeaveError(getErrorMessage(error, 'レシピノートから退出できませんでした。'))
      setLeaving(false)
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
          <h1 className={pageTitleClassName}>レシピノートの設定</h1>
          <p className={pageLeadClassName}>レシピノートを一緒に使うメンバーを管理します。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className={cardClassName}>
          <div className={cardHeadingClassName}>
            <div className={`${cardIconClassName()} flex-none self-start`}><UsersRound size={19} /></div>
            {group ? <RecipeNoteNameHeading key={group.id} group={group} canRename={isOwner && !isDemoUser} titleClassName={cardTitleClassName} /> : null}
          </div>
          <div className="mt-5.5 mb-3.25 h-px bg-border" />
          <div className={detailRowClassName}><span>オーナー</span><strong>{ownerName}</strong></div>
          <div className={detailRowClassName}><span>メンバー数</span><strong>{memberCount}</strong></div>
          {isDemoUser ? <p className={footnoteClassName}><ShieldCheck size={14} /> デモモードの固定データを表示しています。</p> : null}
        </section>

        <section className={cardClassName}>
          <div className={cardHeadingClassName}><div className={cardIconClassName('info')}><UserRound size={19} /></div><h2 className={cardTitleClassName}>メンバー</h2><span className="ml-auto min-w-6.5 rounded-full bg-primary-soft px-1.75 py-0.75 text-center text-12 text-primary-hover">{membersLoading ? '…' : members.length}</span></div>
          <div className="mt-5 grid gap-1.5">
            {members.map((member) => (
              <div className="flex items-center gap-2.5 border-t border-surface-muted py-2.25" key={`${member.group_id}-${member.user_id}`}>
                <div className="grid size-7.5 place-items-center rounded-full bg-primary-soft text-12 font-extrabold text-primary">{getMemberDisplayName(member, user).slice(0, 1)}</div>
                <div className="flex min-w-0 flex-1 flex-col"><strong className="truncate text-13 text-text">{getMemberDisplayName(member, user)}</strong>{member.user_id === user?.id ? <span className="text-12 text-text-muted">あなた</span> : null}</div>
                <span className={`rounded-sm px-2 py-1 text-11 ${member.role === 'owner' ? 'bg-primary-soft text-primary-hover' : 'bg-surface-muted text-text-secondary'}`}>{member.role === 'owner' ? 'オーナー' : 'メンバー'}</span>
                {canRemove(member) ? <button type="button" className={iconButtonClassName({ variant: 'danger' })} onClick={() => setMemberToRemove(member)} aria-label={`${getMemberDisplayName(member, user)}を外す`} title="外す"><UserMinus size={16} /></button> : null}
              </div>
            ))}
          </div>
        </section>

        <section className={`${cardClassName} col-span-full`}>
          <div className={cardHeadingClassName}><div className={cardIconClassName()}><Link2 size={19} /></div><h2 className={cardTitleClassName}>メンバーを招待</h2></div>
          <p className="mt-4 mb-3.25 text-14 leading-[1.6] text-text-secondary">{isDemoUser ? 'デモモードでは、メンバー招待のリンクからログイン画面を案内します。' : 'このリンクを知っている人は、ログイン後にレシピノートへ参加できます。'}</p>
          {isDemoUser ? (
            <a href={inviteUrl} className={`${inviteLinkBoxClassName} hover:border-border-hover hover:text-primary-hover`}><Link2 className="flex-none text-primary" size={16} /><span className="truncate">{inviteUrl}</span></a>
          ) : (
            <div className={inviteLinkBoxClassName}><Link2 className="flex-none text-primary" size={16} /><span className="truncate">{inviteUrl}</span></div>
          )}
          <Button variant="secondary" className="mt-3" onClick={() => void copyInviteLink()}>{copied ? <><Check size={16} /> コピーしました</> : <><Copy size={16} /> 招待リンクをコピー</>}</Button>
        </section>

        {isDemoUser ? null : (
          <section className={`${cardClassName} col-span-full`}>
            <div className={cardHeadingClassName}><div className={cardIconClassName()}><DoorOpen size={19} /></div><h2 className={cardTitleClassName}>レシピノートから退出</h2></div>
            <p className="mt-4 mb-3.25 text-14 leading-[1.6] text-text-secondary">
              {ownerWithOthers
                ? 'ほかのメンバーがいる間は、オーナーは退出できません。メンバーを外すと退出できます。'
                : ownerAlone
                  ? '退出すると、このレシピノートとレシピはすべて削除されます。'
                  : '退出すると、このレシピノートのレシピを見られなくなります。'}
            </p>
            <Button variant="secondary" disabled={membersLoading || ownerWithOthers} onClick={() => setShowLeaveConfirm(true)}>
              <DoorOpen size={16} /> {ownerAlone ? '削除して退出する' : '退出する'}
            </Button>
          </section>
        )}
      </div>

      <section className="mt-8.75 flex flex-col items-start justify-between gap-5 border-t border-border px-1 py-5.25 sm:flex-row sm:items-center">
        <div><h2 className="mb-0.5 text-16 font-bold text-text">アカウント</h2><p className="text-13 text-text-muted">{user?.email}</p></div>
        <Button variant="ghost" onClick={() => void handleSignOut()}><LogOut size={16} /> ログアウト</Button>
      </section>

      {showLeaveConfirm && group ? (
        <ConfirmDialog
          icon={<DoorOpen size={20} />}
          title={ownerAlone ? `「${group.name}」を削除しますか？` : `「${group.name}」から退出しますか？`}
          description={ownerAlone ? 'レシピノートとレシピはすべて削除され、元に戻せません。' : '登録したレシピは残ります。もう一度参加するには招待リンクが必要です。'}
          confirmLabel={ownerAlone ? '削除して退出する' : '退出する'}
          loading={leaving}
          error={leaveError}
          onConfirm={() => void handleLeave()}
          onCancel={closeLeaveConfirm}
        />
      ) : null}

      {memberToRemove ? (
        <ConfirmDialog
          icon={<UserMinus size={20} />}
          title={`${getMemberDisplayName(memberToRemove, user)}さんを外しますか？`}
          description="このレシピノートのレシピを見られなくなります。登録したレシピは残ります。"
          confirmLabel="外す"
          loading={removing}
          error={removeError}
          onConfirm={() => void handleRemove()}
          onCancel={closeRemoveConfirm}
        />
      ) : null}
    </AppShell>
  )
}
