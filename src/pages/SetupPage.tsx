import { ArrowRight, BookOpen, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useApp } from '../contexts/app-context'
import { getErrorMessage } from '../lib/errors'

export function SetupPage() {
  const { createGroup, user, isDemoUser } = useApp()
  const navigate = useNavigate()
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isDemoUser) return <Navigate to="/recipes" replace />

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await createGroup(groupName)
      navigate('/recipes', { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'レシピ帳を作成できませんでした。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-orbit orbit-one" />
      <div className="setup-orbit orbit-two" />
      <div className="setup-card">
        <div className="setup-icon"><BookOpen size={25} /></div>
        <span className="eyebrow">ONE LAST STEP</span>
        <h1>レシピ帳をつくりましょう</h1>
        <p className="setup-lead">家族や友人と共有するレシピ帳に名前をつけます。あとから設定画面で招待できます。</p>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="field-label" htmlFor="group-name">レシピ帳の名前</label>
          <input id="group-name" className="text-input setup-input" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例：我が家のレシピ" maxLength={50} autoFocus required />
          {error ? <div className="alert error" role="alert">{error}</div> : null}
          <Button className="full-width setup-submit" type="submit" loading={isSubmitting}>レシピ帳を作成 <ArrowRight size={17} /></Button>
        </form>
        <div className="setup-perks">
          <div><UsersRound size={16} /><span>あとからメンバーを招待できます</span></div>
          <div><BookOpen size={16} /><span>{user?.email} で作成します</span></div>
        </div>
      </div>
    </div>
  )
}
