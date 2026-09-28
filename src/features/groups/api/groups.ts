import { localGetGroupByInviteToken } from '../../../lib/localStorage'
import { supabase } from '../../../lib/supabase'
import type { Group } from '../../../types/database'

export const getInviteGroup = async (inviteToken: string): Promise<Group | null> => {
  if (!supabase) return localGetGroupByInviteToken(inviteToken)
  const { data, error } = await supabase.rpc('get_group_by_invite_token', {
    p_invite_token: inviteToken,
  })
  if (error) throw error
  const group = Array.isArray(data) ? data[0] : data
  return (group as Group | null) ?? null
}
