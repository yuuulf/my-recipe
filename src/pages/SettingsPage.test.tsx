import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppContext, type AppContextValue } from '../contexts/app-context'
import { appContextValue, testGroup } from '../test/appContextValue'
import type { GroupMember } from '../types/database'
import { SettingsPage } from './SettingsPage'

const member = (userId: string, name: string, role: GroupMember['role']): GroupMember => ({
  group_id: testGroup.id,
  user_id: userId,
  role,
  created_at: '2026-11-13T00:00:00Z',
  profile: { display_name: name },
})

// The signed-in user is 'me' (わたし).
const ownerWithMember = [member('me', 'わたし', 'owner'), member('yuki', 'ゆき', 'member')]
const memberOfOthers = [member('olivia', 'オリビア', 'owner'), member('me', 'わたし', 'member')]

const renderSettings = (overrides: Partial<AppContextValue>) => {
  const value = appContextValue(overrides)
  render(
    <AppContext.Provider value={value}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/recipes" element={<p>レシピ一覧の画面</p>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>,
  )
  return { value, user: userEvent.setup() }
}

describe('SettingsPage: removing members', () => {
  it('lets the owner remove other members, but not herself', () => {
    renderSettings({ members: ownerWithMember })
    expect(screen.getByRole('button', { name: 'ゆきを外す' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'わたしを外す' })).not.toBeInTheDocument()
  })

  it('does not offer removing to a member who is not the owner', () => {
    renderSettings({ members: memberOfOthers })
    expect(screen.queryByRole('button', { name: /を外す$/ })).not.toBeInTheDocument()
  })

  it('does not offer removing in the demo', () => {
    renderSettings({ members: ownerWithMember, isDemoUser: true })
    expect(screen.queryByRole('button', { name: /を外す$/ })).not.toBeInTheDocument()
  })

  it('removes the member after confirming', async () => {
    const { value, user } = renderSettings({ members: ownerWithMember })
    await user.click(screen.getByRole('button', { name: 'ゆきを外す' }))
    const dialog = screen.getByRole('dialog', { name: 'ゆきさんを外しますか？' })
    expect(dialog).toHaveTextContent('登録したレシピは残ります。')
    await user.click(screen.getByRole('button', { name: '外す' }))
    expect(value.removeMember).toHaveBeenCalledWith(testGroup.id, 'yuki')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('keeps the member when the confirmation is cancelled', async () => {
    const { value, user } = renderSettings({ members: ownerWithMember })
    await user.click(screen.getByRole('button', { name: 'ゆきを外す' }))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(value.removeMember).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the error in the confirmation when removing fails', async () => {
    const { user } = renderSettings({
      members: ownerWithMember,
      removeMember: vi.fn(async () => { throw new Error('レシピノートのオーナーだけがメンバーを外せます。') }),
    })
    await user.click(screen.getByRole('button', { name: 'ゆきを外す' }))
    await user.click(screen.getByRole('button', { name: '外す' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('レシピノートのオーナーだけがメンバーを外せます。')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('SettingsPage: leaving', () => {
  const leaveButton = (name: string) => screen.getByRole('button', { name })

  it('lets a member leave after confirming, then opens the recipe list', async () => {
    const { value, user } = renderSettings({ members: memberOfOthers })
    expect(screen.getByText('退出すると、このレシピノートのレシピを見られなくなります。')).toBeInTheDocument()
    await user.click(leaveButton('退出する'))
    const dialog = screen.getByRole('dialog', { name: `「${testGroup.name}」から退出しますか？` })
    expect(dialog).toHaveTextContent('登録したレシピは残ります。')
    await user.click(within(dialog).getByRole('button', { name: '退出する' }))
    expect(value.leaveGroup).toHaveBeenCalledWith(testGroup.id)
    expect(await screen.findByText('レシピ一覧の画面')).toBeInTheDocument()
  })

  it('does not leave when the confirmation is cancelled', async () => {
    const { value, user } = renderSettings({ members: memberOfOthers })
    await user.click(leaveButton('退出する'))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(value.leaveGroup).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not let the owner leave while other members remain', () => {
    renderSettings({ members: ownerWithMember })
    expect(leaveButton('退出する')).toBeDisabled()
    expect(screen.getByText('ほかのメンバーがいる間は、オーナーは退出できません。メンバーを外すと退出できます。')).toBeInTheDocument()
  })

  it('warns an owner alone that leaving deletes the note', async () => {
    const { value, user } = renderSettings({ members: [member('me', 'わたし', 'owner')] })
    expect(screen.getByText('退出すると、このレシピノートとレシピはすべて削除されます。')).toBeInTheDocument()
    await user.click(leaveButton('削除して退出する'))
    const dialog = screen.getByRole('dialog', { name: `「${testGroup.name}」を削除しますか？` })
    expect(dialog).toHaveTextContent('レシピノートとレシピはすべて削除され、元に戻せません。')
    await user.click(within(dialog).getByRole('button', { name: '削除して退出する' }))
    expect(value.leaveGroup).toHaveBeenCalledWith(testGroup.id)
  })

  it('cannot leave until the members are loaded', () => {
    renderSettings({ members: [], membersLoading: true })
    expect(leaveButton('退出する')).toBeDisabled()
  })

  it('shows the error in the confirmation when leaving fails', async () => {
    const { user } = renderSettings({
      members: memberOfOthers,
      leaveGroup: vi.fn(async () => { throw new Error('通信に失敗しました。') }),
    })
    await user.click(leaveButton('退出する'))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '退出する' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました。')
    expect(screen.queryByText('レシピ一覧の画面')).not.toBeInTheDocument()
  })

  it('does not offer leaving in the demo', () => {
    renderSettings({ members: memberOfOthers, isDemoUser: true })
    expect(screen.queryByText('レシピノートから退出')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '退出する' })).not.toBeInTheDocument()
  })
})
