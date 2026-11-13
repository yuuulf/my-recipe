import { describe, expect, it } from 'vitest'
import type { AppUser, GroupMember } from '../types/database'
import { getMemberDisplayName } from './app-context'

const member = (userId: string, displayName: string | null): GroupMember => ({
  group_id: 'group',
  user_id: userId,
  role: 'member',
  created_at: '2026-11-13T00:00:00Z',
  profile: { display_name: displayName },
})

const me: AppUser = { id: 'me', email: 'me@example.com', displayName: 'わたし' }

describe('getMemberDisplayName', () => {
  it('uses the profile name', () => {
    expect(getMemberDisplayName(member('yuki', 'ゆき'), me)).toBe('ゆき')
  })

  it('uses the viewer’s own name when their profile has none', () => {
    expect(getMemberDisplayName(member('me', null), me)).toBe('わたし')
  })

  it('shows 「メンバー」 when no name is known', () => {
    expect(getMemberDisplayName(member('yuki', null), me)).toBe('メンバー')
    expect(getMemberDisplayName({ ...member('yuki', null), profile: null })).toBe('メンバー')
    expect(getMemberDisplayName(member('me', null), { ...me, displayName: null })).toBe('メンバー')
  })
})
