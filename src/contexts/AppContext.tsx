import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  clearDemoSession,
  getDemoGroup,
  getDemoMembers,
  getDemoUser,
  isDemoSessionActive,
  startDemoSession,
} from '../lib/demoData'
import { getSupabase, supabase } from '../lib/supabase'
import { RECIPE_NOTE_NAME_MAX, recipeNoteNameError } from '../features/groups/recipeNoteLimits'
import { AppContext, type AppContextValue } from './app-context'
import type { AppUser, Group, GroupMember } from '../types/database'

const mapUser = (user: User): AppUser => ({
  id: user.id,
  email: user.email ?? '',
  displayName:
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : user.email?.split('@')[0] ?? null,
})

const normalizeGroup = (value: unknown): Group | null => {
  if (!value) return null
  const groupValue = Array.isArray(value) ? value[0] : value
  if (!groupValue || typeof groupValue !== 'object') return null
  return groupValue as Group
}

// Every recipe note the user belongs to, oldest membership first.
const getSupabaseGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await getSupabase()
    .from('group_members')
    .select('group_id, role, created_at, groups(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as Array<{ groups?: unknown }>)
    .map((row) => normalizeGroup(row.groups))
    .filter((value): value is Group => value !== null)
}

// The open recipe note is remembered per account in this browser only.
const groupStorageKey = (userId: string) => `my-recipe:current-group:${userId}`

const readStoredGroupId = (userId: string) => {
  try {
    return window.localStorage.getItem(groupStorageKey(userId))
  } catch {
    return null
  }
}

const storeGroupId = (userId: string, groupId: string) => {
  try {
    window.localStorage.setItem(groupStorageKey(userId), groupId)
  } catch {
    // Without storage the oldest recipe note opens next time, as before.
  }
}

const getSupabaseMembers = async (groupId: string): Promise<GroupMember[]> => {
  const { data, error } = await getSupabase()
    .from('group_members')
    .select('group_id, user_id, role, created_at, profiles(display_name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as Array<{
    group_id: string
    user_id: string
    role: 'owner' | 'member'
    created_at: string
    profiles?: { display_name: string | null } | Array<{ display_name: string | null }>
  }>).map((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles
    return {
      group_id: member.group_id,
      user_id: member.user_id,
      role: member.role,
      created_at: member.created_at,
      profile: profile ? { display_name: profile.display_name } : null,
    }
  })
}

const getSessionUser = (session: Session | null) =>
  session?.user ? mapUser(session.user) : null

const isSameUser = (a: AppUser | null, b: AppUser | null) =>
  a !== null && b !== null && a.id === b.id && a.email === b.email && a.displayName === b.displayName

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [authReady, setAuthReady] = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  // The last load of the user's recipe notes failed. Not the same as having none.
  const [groupError, setGroupError] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(() => isDemoSessionActive())
  // Members of the open recipe note are being loaded; until then they are unknown.
  const [membersLoading, setMembersLoading] = useState(false)
  // The recipe note whose members were requested last. Older results are dropped.
  const membersRequestRef = useRef<string | null>(null)
  // The user whose recipe notes were last loaded from a session event.
  const loadedUserIdRef = useRef<string | null>(null)

  // Loads the user's recipe notes and opens one: the preferred one, else the
  // remembered one, else the oldest membership.
  const loadGroup = useCallback(async (nextUser: AppUser | null, preferredGroupId?: string) => {
    if (!nextUser) {
      setGroups([])
      setGroup(null)
      setMembers([])
      setGroupError(false)
      membersRequestRef.current = null
      setMembersLoading(false)
      return
    }

    setGroupLoading(true)
    setGroupError(false)
    try {
      const nextGroups = await getSupabaseGroups(nextUser.id)
      const wantedId = preferredGroupId ?? readStoredGroupId(nextUser.id)
      const nextGroup = nextGroups.find((item) => item.id === wantedId) ?? nextGroups[0] ?? null
      setGroups(nextGroups)
      setGroup(nextGroup)

      if (nextGroup) {
        storeGroupId(nextUser.id, nextGroup.id)
        membersRequestRef.current = nextGroup.id
        setMembersLoading(true)
        try {
          const nextMembers = await getSupabaseMembers(nextGroup.id)
          if (membersRequestRef.current === nextGroup.id) setMembers(nextMembers)
        } finally {
          if (membersRequestRef.current === nextGroup.id) setMembersLoading(false)
        }
      } else {
        membersRequestRef.current = null
        setMembers([])
      }
    } catch (error) {
      // Keep what was loaded before; the guard shows the failure with a retry.
      console.error('Failed to load group', error)
      setGroupError(true)
    } finally {
      setGroupLoading(false)
    }
  }, [])

  // Applies the user of a session event. Token refreshes and repeated events
  // for the same user keep the screen as it is: the recipe notes are loaded
  // only when the user changes (sign-in, sign-out, another account).
  const applySessionUser = useCallback((nextUser: AppUser | null) => {
    setIsDemoUser(false)
    // Keep the same object so callbacks depending on the user stay the same.
    setUser((current) => (isSameUser(current, nextUser) ? current : nextUser))
    const nextUserId = nextUser?.id ?? null
    if (nextUserId === loadedUserIdRef.current) return
    loadedUserIdRef.current = nextUserId
    void loadGroup(nextUser)
  }, [loadGroup])

  // Opens another recipe note the user belongs to and remembers it.
  const selectGroup = useCallback(async (groupId: string) => {
    if (!user || isDemoUser) return
    const nextGroup = groups.find((item) => item.id === groupId)
    if (!nextGroup || nextGroup.id === group?.id) return
    setGroup(nextGroup)
    setMembers([])
    storeGroupId(user.id, nextGroup.id)
    membersRequestRef.current = nextGroup.id
    setMembersLoading(true)
    try {
      const nextMembers = await getSupabaseMembers(nextGroup.id)
      // Switched again meanwhile: these members belong to another recipe note.
      if (membersRequestRef.current === nextGroup.id) setMembers(nextMembers)
    } catch (error) {
      console.error('Failed to load members', error)
    } finally {
      if (membersRequestRef.current === nextGroup.id) setMembersLoading(false)
    }
  }, [group?.id, groups, isDemoUser, user])

  const activateDemo = useCallback(() => {
    startDemoSession()
    setIsDemoUser(true)
    setUser(getDemoUser())
    setGroups([getDemoGroup()])
    setGroup(getDemoGroup())
    setMembers(getDemoMembers())
    membersRequestRef.current = null
    setMembersLoading(false)
    setGroupLoading(false)
    setGroupError(false)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    let mounted = true

    if (isDemoSessionActive()) {
      activateDemo()
      return () => {
        mounted = false
      }
    }

    // Without connection settings the app shows the setup page, so there is no
    // user to restore. The demo above still works without Supabase.
    if (!supabase) {
      setUser(null)
      setAuthReady(true)
      return () => {
        mounted = false
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isDemoSessionActive()) {
        activateDemo()
        return
      }
      if (!mounted) return
      applySessionUser(getSessionUser(session))
    })

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!mounted) return
      if (isDemoSessionActive()) {
        activateDemo()
        return
      }
      applySessionUser(getSessionUser(sessionData.session))
      setAuthReady(true)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [activateDemo, applySessionUser])

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    const client = getSupabase()

    if (isDemoSessionActive()) {
      loadedUserIdRef.current = null
      setUser(null)
      setGroups([])
      setGroup(null)
      setMembers([])
    }
    clearDemoSession()
    setIsDemoUser(false)

    const loginUrl = new URL('/login', window.location.origin)
    if (redirectPath) loginUrl.searchParams.set('returnTo', redirectPath)

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: loginUrl.toString(),
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    // In the demo without connection settings there is no Supabase session.
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    clearDemoSession()
    loadedUserIdRef.current = null
    setIsDemoUser(false)
    setUser(null)
    setGroups([])
    setGroup(null)
    setMembers([])
    setGroupError(false)
    membersRequestRef.current = null
    setMembersLoading(false)
  }, [])

  const createGroup = useCallback(async (name: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモモードではレシピノートを変更できません。')
    if (!name.trim()) throw new Error('レシピノートの名前を入力してください。')
    if (name.trim().length > RECIPE_NOTE_NAME_MAX) throw new Error(recipeNoteNameError)

    const { data, error } = await getSupabase().rpc('create_group', {
      p_name: name.trim(),
    })
    if (error) throw error
    const nextGroup = normalizeGroup(data)
      ?? (() => {
        throw new Error('レシピノートの作成結果を取得できませんでした。')
      })()
    // Open the new recipe note.
    await loadGroup(user, nextGroup.id)
    return nextGroup
  }, [isDemoUser, loadGroup, user])

  const joinGroup = useCallback(async (inviteToken: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモモードではレシピノートを変更できません。')
    if (!inviteToken.trim()) throw new Error('招待リンクが不正です。')

    const { data, error } = await getSupabase().rpc('join_group', {
      p_invite_token: inviteToken.trim(),
    })
    if (error) throw error
    if (!data) throw new Error('レシピノートに参加できませんでした。')
    // join_group returns the joined note's id, also when already a member. Open it.
    const joinedId = String(data)
    const nextGroups = await getSupabaseGroups(user.id)
    const nextGroup = nextGroups.find((item) => item.id === joinedId) ?? (() => {
      throw new Error('レシピノートに参加した後の情報を取得できませんでした。')
    })()
    await loadGroup(user, nextGroup.id)
    return nextGroup
  }, [isDemoUser, loadGroup, user])

  // Renames a recipe note. The server checks that the user is its owner.
  const renameGroup = useCallback(async (groupId: string, name: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモモードではレシピノートを変更できません。')
    const nextName = name.trim()
    if (!nextName) throw new Error('レシピノートの名前を入力してください。')
    if (nextName.length > RECIPE_NOTE_NAME_MAX) throw new Error(recipeNoteNameError)

    const { data, error } = await getSupabase().rpc('rename_group', {
      p_group_id: groupId,
      p_name: nextName,
    })
    if (error) throw error
    const renamed = normalizeGroup(data)
      ?? (() => {
        throw new Error('レシピノートの名前を変更できませんでした。')
      })()
    setGroups((current) => current.map((item) => (item.id === renamed.id ? renamed : item)))
    setGroup((current) => (current?.id === renamed.id ? renamed : current))
    return renamed
  }, [isDemoUser, user])

  // Leaves a recipe note (an owner alone deletes it; the server checks), then
  // reloads the notes: the oldest remaining one opens, or none, which leads to
  // the setup page.
  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモモードではレシピノートを変更できません。')
    const { error } = await getSupabase().rpc('leave_group', { p_group_id: groupId })
    if (error) throw error
    await loadGroup(user)
  }, [isDemoUser, loadGroup, user])

  // Removes another member of a recipe note. Owners only; the server checks.
  const removeMember = useCallback(async (groupId: string, userId: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモモードではレシピノートを変更できません。')
    const { error } = await getSupabase().rpc('remove_group_member', { p_group_id: groupId, p_user_id: userId })
    if (error) throw error
    if (groupId !== group?.id) return
    // Reload the open note's members, dropping the result if the user switched meanwhile.
    membersRequestRef.current = groupId
    setMembersLoading(true)
    try {
      const nextMembers = await getSupabaseMembers(groupId)
      if (membersRequestRef.current === groupId) setMembers(nextMembers)
    } finally {
      if (membersRequestRef.current === groupId) setMembersLoading(false)
    }
  }, [group?.id, isDemoUser, user])

  const refreshGroup = useCallback(async () => {
    if (isDemoUser) {
      setGroups([getDemoGroup()])
      setGroup(getDemoGroup())
      setMembers(getDemoMembers())
      return
    }
    // Keep the open recipe note.
    await loadGroup(user, group?.id)
  }, [group?.id, isDemoUser, loadGroup, user])

  const value = useMemo<AppContextValue>(() => ({
    user,
    groups,
    group,
    members,
    authReady,
    groupLoading,
    groupError,
    membersLoading,
    isDemoUser,
    enterDemo: activateDemo,
    signInWithGoogle,
    signOut,
    createGroup,
    joinGroup,
    refreshGroup,
    renameGroup,
    selectGroup,
    leaveGroup,
    removeMember,
  }), [
    authReady,
    activateDemo,
    createGroup,
    group,
    groupError,
    groupLoading,
    groups,
    isDemoUser,
    joinGroup,
    leaveGroup,
    members,
    membersLoading,
    refreshGroup,
    removeMember,
    renameGroup,
    selectGroup,
    signInWithGoogle,
    signOut,
    user,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
