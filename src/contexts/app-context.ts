import { createContext, useContext } from 'react'
import { localGetProfileName } from '../lib/localStorage'
import type { AppUser, Group, GroupMember } from '../types/database'

export type AuthResult = {
  magicLinkSent: boolean
}

export type AppContextValue = {
  user: AppUser | null
  group: Group | null
  members: GroupMember[]
  authReady: boolean
  groupLoading: boolean
  isDemoMode: boolean
  isDemoUser: boolean
  enterDemo: () => void
  signIn: (email: string, redirectPath?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  createGroup: (name: string) => Promise<Group>
  joinGroup: (inviteToken: string) => Promise<Group>
  refreshGroup: () => Promise<void>
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
  localGetProfileName(member.user_id) ||
  'メンバー'
