import { vi } from 'vitest'
import type { AppContextValue } from '../contexts/app-context'
import type { Group } from '../types/database'

export const testGroup: Group = {
  id: '00000000-0000-4000-8000-000000000100',
  name: 'サンプルのレシピノート',
  invite_token: '00000000-0000-4000-8000-000000000101',
  created_by: 'owner',
  created_at: '2026-11-13T00:00:00Z',
}

// A signed-in user with one loaded recipe note. Override what a test needs.
export const appContextValue = (overrides: Partial<AppContextValue> = {}): AppContextValue => ({
  user: { id: 'me', email: 'me@example.com', displayName: 'わたし' },
  groups: [testGroup],
  group: testGroup,
  members: [],
  membersLoading: false,
  authReady: true,
  groupLoading: false,
  groupError: false,
  isDemoUser: false,
  enterDemo: vi.fn(),
  signInWithGoogle: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  createGroup: vi.fn(async () => testGroup),
  joinGroup: vi.fn(async () => testGroup),
  refreshGroup: vi.fn(async () => {}),
  selectGroup: vi.fn(async () => {}),
  renameGroup: vi.fn(async () => testGroup),
  leaveGroup: vi.fn(async () => 'switched' as const),
  removeMember: vi.fn(async () => {}),
  ...overrides,
})
