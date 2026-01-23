'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function disconnect1Chon(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // Delete relationship in both directions to ensure clean break
  const { error } = await supabase
    .from('relationships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)

  if (error) {
    console.error('Unfriend error:', error)
    throw new Error('Failed to unfriend')
  }

  // Also delete any notifications related to Likes between them to clean up?
  // Optional but good for privacy. "Remove trace".
  // Let's stick to prompt: "상호 연결 데이터 삭제".

  revalidatePath('/members')
  revalidatePath(`/members/${targetUserId}`)
  return { success: true }
}

export async function sendLike(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Create the relationship
    const { error } = await supabase.from('relationships').insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: 'pending' 
    })

    if (error) {
        console.error('Send like error:', error)
        if (error.code === '23505') { // Unique violation
            throw new Error('이미 1촌 신청을 보냈거나 1촌입니다.')
        }
        throw new Error(`Failed to send like: ${error.message}`)
    }
    
    revalidatePath(`/members/${targetUserId}`)
    return { success: true }
}
