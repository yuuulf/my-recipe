import {
  useCallback,
  useEffect,
  useMemo,
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

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [authReady, setAuthReady] = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(() => isDemoSessionActive())

  // Loads the user's recipe notes and opens one: the preferred one, else the
  // remembered one, else the oldest membership.
  const loadGroup = useCallback(async (nextUser: AppUser | null, preferredGroupId?: string) => {
    if (!nextUser) {
      setGroups([])
      setGroup(null)
      setMembers([])
      return
    }

    setGroupLoading(true)
    try {
      const nextGroups = await getSupabaseGroups(nextUser.id)
      const wantedId = preferredGroupId ?? readStoredGroupId(nextUser.id)
      const nextGroup = nextGroups.find((item) => item.id === wantedId) ?? nextGroups[0] ?? null
      setGroups(nextGroups)
      setGroup(nextGroup)

      if (nextGroup) {
        storeGroupId(nextUser.id, nextGroup.id)
        setMembers(await getSupabaseMembers(nextGroup.id))
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Failed to load group', error)
      setGroups([])
      setGroup(null)
      setMembers([])
    } finally {
      setGroupLoading(false)
    }
  }, [])

  // Opens another recipe note the user belongs to and remembers it.
  const selectGroup = useCallback(async (groupId: string) => {
    if (!user || isDemoUser) return
    const nextGroup = groups.find((item) => item.id === groupId)
    if (!nextGroup || nextGroup.id === group?.id) return
    setGroup(nextGroup)
    setMembers([])
    storeGroupId(user.id, nextGroup.id)
    try {
      setMembers(await getSupabaseMembers(nextGroup.id))
    } catch (error) {
      console.error('Failed to load members', error)
    }
  }, [group?.id, groups, isDemoUser, user])

  const activateDemo = useCallback(() => {
    startDemoSession()
    setIsDemoUser(true)
    setUser(getDemoUser())
    setGroups([getDemoGroup()])
    setGroup(getDemoGroup())
    setMembers(getDemoMembers())
    setGroupLoading(false)
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
      const nextUser = getSessionUser(session)
      if (!mounted) return
      setIsDemoUser(false)
      setUser(nextUser)
      void loadGroup(nextUser)
    })

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!mounted) return
      if (isDemoSessionActive()) {
        activateDemo()
        return
      }
      const nextUser = getSessionUser(sessionData.session)
      setIsDemoUser(false)
      setUser(nextUser)
      setAuthReady(true)
      void loadGroup(nextUser)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [activateDemo, loadGroup])

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    const client = getSupabase()

    if (isDemoSessionActive()) {
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
    setIsDemoUser(false)
    setUser(null)
    setGroups([])
    setGroup(null)
    setMembers([])
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
    isDemoUser,
    enterDemo: activateDemo,
    signInWithGoogle,
    signOut,
    createGroup,
    joinGroup,
    refreshGroup,
    renameGroup,
    selectGroup,
  }), [
    authReady,
    activateDemo,
    createGroup,
    group,
    groupLoading,
    groups,
    isDemoUser,
    joinGroup,
    members,
    refreshGroup,
    renameGroup,
    selectGroup,
    signInWithGoogle,
    signOut,
    user,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
