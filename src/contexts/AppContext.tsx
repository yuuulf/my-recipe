import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  getLocalUser,
  localCreateGroup,
  localGetCurrentGroup,
  localGetMembers,
  localJoinGroup,
  localSignIn,
  localSignOut,
} from '../lib/localStorage'
import {
  clearDemoSession,
  getDemoGroup,
  getDemoMembers,
  getDemoUser,
  isDemoSessionActive,
  startDemoSession,
} from '../lib/demoData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AppContext, type AppContextValue, type AuthResult } from './app-context'
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

const getSupabaseGroup = async (userId: string): Promise<Group | null> => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, created_at, groups(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return normalizeGroup((data as { groups?: unknown } | null)?.groups)
}

const getSupabaseMembers = async (groupId: string): Promise<GroupMember[]> => {
  if (!supabase) return []
  const { data, error } = await supabase
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
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [authReady, setAuthReady] = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(() => isDemoSessionActive())

  const loadGroup = useCallback(async (nextUser: AppUser | null) => {
    if (!nextUser) {
      setGroup(null)
      setMembers([])
      return
    }

    setGroupLoading(true)
    try {
      const nextGroup = isSupabaseConfigured
        ? await getSupabaseGroup(nextUser.id)
        : localGetCurrentGroup(nextUser.id)
      setGroup(nextGroup)

      if (nextGroup) {
        const nextMembers = isSupabaseConfigured
          ? await getSupabaseMembers(nextGroup.id)
          : localGetMembers(nextGroup.id)
        setMembers(nextMembers)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Failed to load group', error)
      setGroup(null)
      setMembers([])
    } finally {
      setGroupLoading(false)
    }
  }, [])

  const activateDemo = useCallback(() => {
    startDemoSession()
    setIsDemoUser(true)
    setUser(getDemoUser())
    setGroup(getDemoGroup())
    setMembers(getDemoMembers())
    setGroupLoading(false)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const bootLocal = () => {
      const localUser = getLocalUser()
      if (!mounted) return
      setIsDemoUser(false)
      setUser(localUser)
      setAuthReady(true)
      void loadGroup(localUser)
    }

    if (isDemoSessionActive()) {
      activateDemo()
      return () => {
        mounted = false
      }
    }

    if (!supabase) {
      bootLocal()
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

  const signIn = useCallback(async (email: string, redirectPath = '/recipes'): Promise<AuthResult> => {
    if (!email.trim()) throw new Error('メールアドレスを入力してください。')

    clearDemoSession()
    setIsDemoUser(false)

    if (!supabase) {
      const nextUser = localSignIn(email.trim())
      setUser(nextUser)
      await loadGroup(nextUser)
      return { magicLinkSent: false }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
      },
    })
    if (error) throw error
    return { magicLinkSent: true }
  }, [loadGroup])

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } else {
      localSignOut()
    }
    clearDemoSession()
    setIsDemoUser(false)
    setUser(null)
    setGroup(null)
    setMembers([])
  }, [])

  const createGroup = useCallback(async (name: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモユーザーはグループを変更できません。')
    if (!name.trim()) throw new Error('グループ名を入力してください。')

    let nextGroup: Group
    if (supabase) {
      const { data, error } = await supabase.rpc('create_group', {
        p_name: name.trim(),
      })
      if (error) throw error
      nextGroup = normalizeGroup(data)
        ?? (() => {
          throw new Error('グループの作成結果を取得できませんでした。')
        })()
    } else {
      nextGroup = localCreateGroup(name.trim(), user.id)
    }
    setGroup(nextGroup)
    await loadGroup(user)
    if (supabase) {
      setGroup(nextGroup)
      setMembers(await getSupabaseMembers(nextGroup.id))
    }
    return nextGroup
  }, [isDemoUser, loadGroup, user])

  const joinGroup = useCallback(async (inviteToken: string) => {
    if (!user) throw new Error('ログインが必要です。')
    if (isDemoUser) throw new Error('デモユーザーはグループを変更できません。')
    if (!inviteToken.trim()) throw new Error('招待リンクが不正です。')

    let nextGroup: Group
    if (supabase) {
      const { data, error } = await supabase.rpc('join_group', {
        p_invite_token: inviteToken.trim(),
      })
      if (error) throw error
      await loadGroup(user)
      nextGroup = await getSupabaseGroup(user.id) ?? (() => {
        throw new Error('グループ参加後の情報を取得できませんでした。')
      })()
      if (!data) throw new Error('グループに参加できませんでした。')
    } else {
      nextGroup = localJoinGroup(inviteToken.trim(), user.id)
      setGroup(nextGroup)
      await loadGroup(user)
    }
    if (supabase) {
      setGroup(nextGroup)
      setMembers(await getSupabaseMembers(nextGroup.id))
    }
    return nextGroup
  }, [isDemoUser, loadGroup, user])

  const refreshGroup = useCallback(async () => {
    if (isDemoUser) {
      setGroup(getDemoGroup())
      setMembers(getDemoMembers())
      return
    }
    await loadGroup(user)
  }, [isDemoUser, loadGroup, user])

  const value = useMemo<AppContextValue>(() => ({
    user,
    group,
    members,
    authReady,
    groupLoading,
    isDemoMode: !isSupabaseConfigured,
    isDemoUser,
    enterDemo: activateDemo,
    signIn,
    signOut,
    createGroup,
    joinGroup,
    refreshGroup,
  }), [
    authReady,
    activateDemo,
    createGroup,
    group,
    groupLoading,
    isDemoUser,
    joinGroup,
    members,
    refreshGroup,
    signIn,
    signOut,
    user,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
