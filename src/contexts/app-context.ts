import { createContext, useContext } from 'react'
import type { AppUser, Group, GroupMember } from '../types/database'

export type AppContextValue = {
  user: AppUser | null
  // Every recipe note the user belongs to, oldest membership first.
  groups: Group[]
  // The open recipe note.
  group: Group | null
  members: GroupMember[]
  // True while the open recipe note's members are loading.
  membersLoading: boolean
  authReady: boolean
  groupLoading: boolean
  // Loading the recipe notes failed; refreshGroup tries again.
  groupError: boolean
  isDemoUser: boolean
  enterDemo: () => void
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signOut: () => Promise<void>
  createGroup: (name: string) => Promise<Group>
  joinGroup: (inviteToken: string) => Promise<Group>
  refreshGroup: () => Promise<void>
  selectGroup: (groupId: string) => Promise<void>
  // Owners only; the server rejects everyone else.
  renameGroup: (groupId: string, name: string) => Promise<Group>
  // Leaves a recipe note. An owner can leave only when alone, which deletes it.
  leaveGroup: (groupId: string) => Promise<void>
  // Owners only; removes another member. The server rejects everyone else.
  removeMember: (groupId: string, userId: string) => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export const useAuth = useApp
export const useCurrentGroup = useApp

export const getMemberDisplayName = (member: GroupMember, user?: AppUser | null) =>
  member.profile?.display_name ||
  (user?.id === member.user_id ? user.displayName : null) ||
  'メンバー'
