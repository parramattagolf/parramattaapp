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



export async function rejectFriendRequest(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Find the relationship where I am the friend_id
    const { data: rel, error: fetchError } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('friend_id', user.id)
        .maybeSingle()

    if (fetchError) throw new Error('요청을 찾을 수 없습니다.')
    if (!rel) throw new Error('요청이 존재하지 않습니다.')

    // Update status to rejected and increment count
    const newCount = (rel.rejection_count || 0) + 1
    
    // If we want to clean up if it's already rejected? No, this action is for "Rejecting a Pending Request".
    // Or rejecting an existing rejection? (Unlikely).
    // Assume input is a Pending request.

    const { error } = await supabase
        .from('relationships')
        .update({ 
            status: 'rejected', 
            rejection_count: newCount
        })
        .eq('id', rel.id)

    if (error) {
        console.error('Reject error:', error)
        throw new Error('거절 처리 중 오류가 발생했습니다.')
    }

    // Send notification to the requester (User A)
    // "1촌 거절"
    // Content depends on count?
    // If count >= 2, maybe "더 이상 신청할 수 없습니다"? 
    // Just generic rejection msg.
    
    const { data: userData } = await supabase.from('users').select('nickname').eq('id', user.id).single()
    const nickname = userData?.nickname || '알 수 없는 사용자'

    await supabase.from('notifications').insert({
        receiver_id: targetUserId,
        sender_id: user.id,
        type: 'general',
        title: '1촌 신청 거절',
        content: `${nickname}님이 1촌 신청을 거절했습니다.`,
        link_url: `/members/${user.id}`, // Link to profile so they see the red/black button
        is_read: false
    })

    revalidatePath(`/members/${user.id}`) // My profile
    revalidatePath(`/members/${targetUserId}`) // Their profile
    revalidatePath('/my/network')
    
    return { success: true }
}

// Helper to check level
function isLevelAllowed(level: string | null) {
    if (!level) return false // Default RED?
    const levels = ['RED', 'YELLOW', 'WHITE', 'BLUE', 'BLACK', 'VIP']
    const idx = levels.indexOf(level.toUpperCase())
    return idx >= 1 // YELLOW is index 1
}

// Updated sendLike (Request Connection)
export async function sendLike(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // 1. Check Membership Level
    const { data: userData } = await supabase
        .from('users')
        .select('nickname, membership_level')
        .eq('id', user.id)
        .single()
    
    const level = userData?.membership_level || 'RED'
    if (!isLevelAllowed(level)) {
        throw new Error('RED 등급 회원은 1촌 신청을 할 수 없습니다. 프로필을 완성해주세요.')
    }

    // Check Target Membership Level
    const { data: targetData } = await supabase
        .from('users')
        .select('membership_level')
        .eq('id', targetUserId)
        .single()
    
    if (!isLevelAllowed(targetData?.membership_level || 'RED')) {
        throw new Error('상대방이 RED 등급이므로 1촌 신청을 보낼 수 없습니다.')
    }

    const nickname = userData?.nickname || '알 수 없는 사용자'

    // 2. Check Existing Relationship
    const { data: existing } = await supabase
        .from('relationships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
        .maybeSingle()
    
    if (existing) {
        if (existing.status === 'accepted') {
            throw new Error('이미 1촌 관계입니다.')
        }
        if (existing.status === 'pending') {
            throw new Error('이미 1촌 신청을 보냈거나 받았습니다.')
        }
        if (existing.status === 'rejected') {
            // Check direction: Did I send it?
            if (existing.user_id !== user.id) {
                // I received it and rejected it? Or they sent it and rejected?
                // If I am friend_id (Recipient), and status is rejected, it means *I* rejected *them*.
                // If I click "Request" now, I am sending a *NEW* request to them.
                // This reverses the roles.
                // We should DELETE the old row and INSERT new row (Resetting count?) 
                // OR Update the row?
                // Prompt: "1촌신청을 수락하면 1촌관계가 맺어지고... 거절하면... 1촌재신청 버튼으로 바뀌고... 재신청에서도 거절당하면 1촌거절(Black)."
                // NOTE: This flow assumes the SAME SENDER is trying again.
                // Case: A sends to B. B rejects. A sees "Re-request". A clicks. Status -> "Pending".
                // Case: B rejects A. B visits A's profile. B sees "Request" (Normal?).
                // Let's handle the "Re-request" case (I am the original sender).
                
                if (existing.rejection_count && existing.rejection_count >= 2) {
                     throw new Error('더 이상 1촌 신청을 보낼 수 없습니다. (거절 2회)')
                }
                
                // Update to Pending
                const { error: upError } = await supabase
                    .from('relationships')
                    .update({ status: 'pending' }) // Count stays same until rejected again? Or reset? Logic usually implies count accumulates rejections.
                    .eq('id', existing.id)
                
                if (upError) throw new Error('재신청 실패')
                
                // Notify
                await supabase.from('notifications').insert({
                    receiver_id: targetUserId,
                    sender_id: user.id,
                    type: 'friend_request',
                    title: '1촌 재신청',
                    content: `${nickname}님이 1촌 신청을 다시 보냈습니다.`,
                    action_type: 'ACCEPT_FRIEND_REQUEST',
                    link_url: `/members/${user.id}`,
                    is_read: false
                })

                revalidatePath(`/members/${targetUserId}`)
                return { success: true }
            } else {
                // existing.user_id === user.id. I sent it, and it was rejected.
                // Same logic as above? Wait.
                // If `existing.user_id === user.id`, *I* sent it. 
                // Wait, if it was rejected, it means THEY rejected ME.
                // So if I click, it is a Re-request.
                
                if ((existing.rejection_count || 0) >= 2) {
                     throw new Error('더 이상 1촌 신청을 보낼 수 없습니다. (거절 2회)')
                }

                // Update status
                const { error: upError } = await supabase
                    .from('relationships')
                    .update({ status: 'pending' })
                    .eq('id', existing.id)

                if (upError) throw new Error('재신청 실패')

                // Notify
                await supabase.from('notifications').insert({
                    receiver_id: targetUserId,
                    sender_id: user.id,
                    type: 'friend_request',
                    title: '1촌 재신청',
                    content: `${nickname}님이 1촌 신청을 다시 보냈습니다.`,
                    action_type: 'ACCEPT_FRIEND_REQUEST',
                    link_url: `/members/${user.id}`,
                    is_read: false
                })
                
                revalidatePath(`/members/${targetUserId}`)
                return { success: true }
            }
        }
    }

    // 3. New Request
    const { error } = await supabase.from('relationships').insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: 'pending' 
    })

    if (error) {
        console.error('Send like error:', error)
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
