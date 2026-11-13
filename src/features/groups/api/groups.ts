import { getSupabase } from '../../../lib/supabase'
import { isUuid } from '../../../lib/uuid'
import type { Group } from '../../../types/database'

export const getInviteGroup = async (inviteToken: string): Promise<Group | null> => {
  // Not an invite token: the link is invalid, so do not ask the database.
  if (!isUuid(inviteToken)) return null
  const { data, error } = await getSupabase().rpc('get_group_by_invite_token', {
    p_invite_token: inviteToken,
  })
  if (error) throw error
  const group = (Array.isArray(data) ? data[0] : data) as Group | null
  // An unknown token returns a row whose columns are all null.
  return group?.id ? group : null
}
