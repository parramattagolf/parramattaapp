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

    // Get current user's nickname for the notification
    const { data: userData } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()
    
    const nickname = userData?.nickname || '알 수 없는 사용자'

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

    // Create Notification
    await supabase.from('notifications').insert({
        receiver_id: targetUserId,
        sender_id: user.id,
        type: 'friend_request',
        title: '1촌 신청',
        content: `${nickname}님이 1촌 신청을 보냈습니다.`,
        action_type: 'ACCEPT_FRIEND_REQUEST',
        link_url: `/members/${user.id}`,
        is_read: false
    })
    
    revalidatePath(`/members/${targetUserId}`)
    return { success: true }
}

export async function acceptFriendRequest(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // 1. Update the pending request to accepted
    const { error: updateError } = await supabase
        .from('relationships')
        .update({ status: 'accepted' })
        .eq('user_id', targetUserId)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

    if (updateError) {
        console.error('Accept friend error:', updateError)
        throw new Error('수락 처리 중 오류가 발생했습니다.')
    }

    // 2. Insert the reverse relationship as accepted
    const { error: insertError } = await supabase
        .from('relationships')
        .insert({
            user_id: user.id,
            friend_id: targetUserId,
            status: 'accepted'
        })
        .select() // to check if it worked, or handle upsert if needed

    // If reverse relationship already exists (unlikely in pure pending flow but possible), upsert might be safer
    // But simplistic approach first.

    if (insertError) {
        // If it failed because it exists, try update
        if (insertError.code === '23505') {
            await supabase
                .from('relationships')
                .update({ status: 'accepted' })
                .eq('user_id', user.id)
                .eq('friend_id', targetUserId)
        } else {
             console.error('Reverse accept friend error:', insertError)
        }
    }

    // 3. Send notification back to the requester
    const { data: userData } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()
    const nickname = userData?.nickname || '알 수 없는 사용자'

    await supabase.from('notifications').insert({
        receiver_id: targetUserId,
        sender_id: user.id,
        type: 'general',
        title: '1촌 수락',
        content: `${nickname}님이 1촌 신청을 수락했습니다.`,
        link_url: `/members/${user.id}`,
        is_read: false
    })

    revalidatePath('/members')
    revalidatePath(`/members/${targetUserId}`)
    revalidatePath('/my/network')

    return { success: true }
}
