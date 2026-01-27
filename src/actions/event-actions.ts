'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const course_name = formData.get('course_name') as string
    const start_date = formData.get('start_date') as string
    const cost = formData.get('cost') as string
    const max_participants = formData.get('max_participants') as string
    const description = formData.get('description') as string
    const theme = formData.get('theme') as string || 'General'

    // Location can be same as course name for now or separate
    const location = course_name

    // Calculate end_date (Default 5 hours later?)
    const start = new Date(start_date)
    const end = new Date(start.getTime() + 5 * 60 * 60 * 1000)

    const { data, error } = await supabase
        .from('events')
        .insert({
            host_id: user.id,
            title,
            course_name,
            location,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            cost: parseFloat(cost),
            max_participants: parseInt(max_participants),
            description,
            status: 'open',
            theme
        })
        .select()
        .single()

    if (error) {
        console.error('Create Event Error:', error)
        throw new Error('Failed to create event')
    }

    // Auto-join host
    await supabase.from('participants').insert({
        event_id: data.id,
        user_id: user.id,
        status: 'joined',
        payment_status: 'pending' // Host is treated as a regular participant (subject to payment/penalties)
    })


    revalidatePath('/rounds')
    redirect(`/rounds/${data.id}`)
}

export async function joinEvent(eventId: string, groupNo: number = 1) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if full (Global check)
    const { data: event } = await supabase.from('events').select('max_participants, title').eq('id', eventId).single()
    
    // Check if already joined
    const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existingParticipant) {
        throw new Error('이미 참가 중인 라운딩입니다.')
    }

    const { count: totalCount } = await supabase.from('participants').select('*', { count: 'exact' }).eq('event_id', eventId)

    if (event && totalCount !== null && totalCount >= event.max_participants) {
        throw new Error('Event is full')
    }

    // Check if Group is full (Max 4 per group)
    const { count: groupCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)
        .eq('group_no', groupNo)

    // Check Held Slots for this group
    const { data: heldSlots } = await supabase
        .from('held_slots')
        .select('invited_user_id, id')
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .gt('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()) // Only last 1 hour

    const heldCount = heldSlots?.length || 0
    const currentCount = groupCount || 0
    
    // Check if user is one of the invited users
    const myHold = heldSlots?.find(h => h.invited_user_id === user.id)

    // Effective fullness check
    // If I have a hold, I take up one "held" spot, so I can enter if (current + held <= 4).
    // Actually, if I have a hold, that hold "reserved" a spot for me. 
    // So if (current + held > 4), it implies 4 people are there/held. 
    // If I join, I replace my hold with a participant entry.
    // So if I have a hold, space is guaranteed unless logic is broken.
    // If I don't have a hold, I can only join if (current + held < 4).

    if (myHold) {
       // User has a reserved spot. Allow join.
       // The hold will be deleted/consumed below or after insert? 
       // Better to delete it *after* successful insert to verify transaction? 
       // Or before? `participants` insert might fail if full constraints exist in DB triggers?
       // Assuming app-level check.
    } else {
       // Regular join attempting to take an empty spot
       if (currentCount + heldCount >= 4) {
           throw new Error(`${groupNo}번 조인방은 만석이거나 예약된 좌석만 남았습니다.`)
       }
    }

    // New: Check if previous room is filled (Sequential Joining)
    // Only enforced for non-admins and users without a specific invitation hold
    if (groupNo > 1) {
        const { count: prevRoomCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact' })
            .eq('event_id', eventId)
            .eq('group_no', groupNo - 1)

        if (prevRoomCount !== null && prevRoomCount < 4) {
            // Check if user is an admin (skip check)
            const { data: userData } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
            
            // Re-use myHold check from above
            if (!userData?.is_admin && !myHold) {
                throw new Error(`${groupNo - 1}번 조인방이 아직 다 차지 않았습니다. 순서대로 참여해 주세요.`)
            }
        }
    }

    const { error } = await supabase.from('participants').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'joined',
        payment_status: 'pending',
        group_no: groupNo
    })

    if (error) throw new Error('Failed to join')
    
    // If joined successfully and had a hold, remove the hold
    if (myHold) {
        await supabase.from('held_slots').delete().eq('id', myHold.id)
    }


    if (groupCount === 0) {
        // User becomes room host! Increment host_count
        try {
            const { data: userData } = await supabase.from('users').select('host_count').eq('id', user.id).single()
            if (userData) {
                await supabase.from('users').update({
                    host_count: (userData.host_count || 0) + 1
                }).eq('id', user.id)
            }

            // Log host history
            await supabase.from('host_history').insert({
                user_id: user.id,
                event_id: eventId,
                group_no: groupNo
            })
        } catch (e) {
            console.error('Failed to update host count:', e)
        }
    }


    // If user was pre-reserved, remove from pre_reservations
    await supabase.from('pre_reservations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    // Send payment pending notification
    if (event) {
        const { notifyPaymentPending, sendPushToUser } = await import('@/actions/notification-actions')
        await notifyPaymentPending(user.id, event.title)

        // Notify existing room members
        const { data: roomMembers } = await supabase
            .from('participants')
            .select('user_id')
            .eq('event_id', eventId)
            .eq('group_no', groupNo)
            .neq('user_id', user.id) // Exclude self

        if (roomMembers && roomMembers.length > 0) {
            const inviteUrl = `/rounds/${eventId}/rooms/${groupNo}`
            
            // Parallel sending
            await Promise.all(roomMembers.map(member => 
                sendPushToUser(
                    member.user_id, 
                    '동반자 조인 알림 ⛳', 
                    `'${event.title}' ${groupNo}번방에 새로운 동반자가 참여했습니다!`, 
                    inviteUrl
                )
            ))
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true }
}

export async function leaveEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Find group_no for handleHostSuccession
    const { data: participant } = await supabase
        .from('participants')
        .select('group_no')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    // Increment cancel_count for the user
    const { data: userData } = await supabase
        .from('users')
        .select('cancel_count')
        .eq('id', user.id)
        .single()
    
    await supabase
        .from('users')
        .update({ cancel_count: (userData?.cancel_count || 0) + 1 })
        .eq('id', user.id)

    // Release all held slots by this user
    await supabase
        .from('held_slots')
        .delete()
        .eq('event_id', eventId)
        .eq('held_by', user.id)

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    // Host Succession
    if (participant?.group_no) {
        await handleHostSuccession(eventId, participant.group_no, user.id)
    }

    // Check if any participants left in the event
    const { count: remainingCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)

    // If no one left, release all pre-reservations and redirect
    if (remainingCount === 0) {
        // Release all held slots for the event (just to be safe)
        await supabase
            .from('held_slots')
            .delete()
            .eq('event_id', eventId)

        return { success: true, redirectUrl: '/rounds', message: '마지막 참가자가 퇴장하여 라운딩 목록으로 이동합니다.' }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '조인이 취소되었습니다.' }
}

export async function inviteParticipant(eventId: string, targetUserId: string, roomNumber?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if already joined
    const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .single()

    if (existingParticipant) {
        throw new Error('이미 참가 중인 회원입니다.')
    }

    // Get event and sender info
    const { data: event } = await supabase.from('events').select('title, max_participants').eq('id', eventId).single()
    const { data: senderData } = await supabase.from('users').select('nickname').eq('id', user.id).single()

    if (!event || !senderData) {
        throw new Error('라운딩 정보를 찾을 수 없습니다.')
    }

    // Check if full
    const { count } = await supabase.from('participants').select('*', { count: 'exact' }).eq('event_id', eventId)
    if (count !== null && count >= event.max_participants) {
        throw new Error('조인방이 꽉 찼습니다.')
    }

    // Determine link URL (to specific room if provided)
    const linkUrl = roomNumber
        ? `/rounds/${eventId}/rooms/${roomNumber}`
        : `/rounds/${eventId}`

    // Check relationship (1st degree = 'accepted')
    const { data: relationship } = await supabase
        .from('relationships')
        .select('status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
        .eq('status', 'accepted')
        .maybeSingle()
    
    const isFirstDegree = !!relationship

    if (isFirstDegree) {
        // --- 1st Degree: Direct Join ---
        const { error: joinError } = await supabase.from('participants').insert({
            event_id: eventId,
            user_id: targetUserId,
            status: 'joined',
            payment_status: 'pending',
            group_no: roomNumber || 1 
        })

        if (joinError) throw new Error('친구 참가 추가 실패 (이미 참가중이거나 만석일 수 있습니다)')

        // Notify friend
         const inviteContent = roomNumber
            ? `"${event.title}" 라운딩 ${roomNumber}번방에 ${senderData.nickname}님이 귀하를 참가시켰습니다!`
            : `"${event.title}" 라운딩에 ${senderData.nickname}님이 귀하를 참가시켰습니다!`

         await supabase.from('notifications').insert({
            receiver_id: targetUserId,
            sender_id: user.id,
            type: 'invite', // Or 'alert'
            action_type: 'join',
            title: `${senderData.nickname}님과의 라운딩 확정 ⛳`,
            content: inviteContent,
            link_url: linkUrl,
            is_read: false
        })

        revalidatePath(`/rounds/${eventId}`)
        return { success: true, message: '친구를 바로 라운딩에 참가시켰습니다.' }

    } else {
        // --- 2nd Degree+: Hold Slot & Invite ---
        
        // Find an empty slot index [0, 1, 2, 3]
        if (!roomNumber) throw new Error('조인방 번호가 필요합니다.') // Should be passed from UI

        const { data: currentMembers } = await supabase
            .from('participants')
            .select('id') // Just need count effectively, but index mapping relies on order? 
            // Actually, slot_index in held_slots is for visual Grid mapping.
            // Participants don't have slot_index, they just fill the list.
            // "Slots" are conceptual. 0,1,2,3.
            // If there are 2 participants, they take 0,1 (visually sorted by join time).
            // So held slot should be 2.
            // But this is fragile if someone leaves.
            // Ideally `held_slots` shouldn't rely on `slot_index` strictly if styling handles it, but the Grid component USES slot_index for held slots.
            // Let's assume sequential: next available index.
            .eq('event_id', eventId)
            .eq('group_no', roomNumber)
        
        const { data: currentHolds } = await supabase
            .from('held_slots')
            .select('slot_index')
            .eq('event_id', eventId)
            .eq('group_no', roomNumber)
        
        const occupiedIndices = new Set<number>()
        // Participants take 0..N-1 ? No, participants just take *count* spots.
        // Visually, participants fill the FIRST available spots.
        const partCount = currentMembers?.length || 0
        for(let i=0; i<partCount; i++) occupiedIndices.add(i)
        
        // Holds take specific indices? 
        // In the Grid: "roomMembers[i]" takes slot i. 
        // So participants ALWAYS take 0 to (Count-1).
        // Held slots must take Count to 3.
        
        // So we just need to find the first index >= partCount that isn't held.
        let targetSlotIndex = -1
        for (let i = partCount; i < 4; i++) {
             // Check if held
             if (!currentHolds?.some(h => h.slot_index === i)) {
                 targetSlotIndex = i
                 break
             }
        }
        
        if (targetSlotIndex === -1) {
             throw new Error('예약 가능한 빈 슬롯이 없습니다 (참가자 또는 다른 홀드로 가득 찼습니다).')
        }

        const { error: holdError } = await supabase.from('held_slots').insert({
            event_id: eventId,
            group_no: roomNumber,
            slot_index: targetSlotIndex,
            held_by: user.id,
            invited_user_id: targetUserId
        })

        if (holdError) throw new Error('슬롯 홀드 실패')

        // Improved invite message
        const inviteContent = `"${event.title}" 라운딩 ${roomNumber}번방에 초대되었습니다. 호스트가 슬롯을 예약해두었습니다!`

        // Send invite notification with link
        const { error: notifError } = await supabase.from('notifications').insert({
            receiver_id: targetUserId,
            sender_id: user.id,
            type: 'invite',
            action_type: 'invite',
            title: `${senderData.nickname}님이 라운딩에 초대했습니다 👋`,
            content: inviteContent,
            link_url: linkUrl,
            is_read: false
        })

        if (notifError) {
            console.error('Invite notification error', notifError)
             // Should rollback hold?
        }

        // Increment sender's invite_count
        try {
            const { data: senderUserData } = await supabase.from('users').select('invite_count').eq('id', user.id).single()
            if (senderUserData) {
                await supabase.from('users').update({
                    invite_count: (senderUserData.invite_count || 0) + 1
                }).eq('id', user.id)
            }
        } catch (e) {
            console.error('Failed to update invite count:', e)
        }

        revalidatePath(`/rounds/${eventId}`)
        return { success: true, message: '초대 메시지를 전송하고 슬롯을 예약했습니다.' }
    }
}

export async function kickParticipant(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const eventId = formData.get('eventId') as string
    const targetUserId = formData.get('userId') as string

    // Verify Host (RLS handles update/delete policies usually, but for delete on participants, 
    // we defined "Users can update own, Host can update all" -> Wait, that was for UPDATE. 
    // DELETE policy? I didn't set DELETE policy explicitly for Host kicking others.
    // I set "Users can update own...". I need to check DELETE policy.
    // Default RLS is deny all. I need to check migration_phase3.sql again.

    // Let's rely on server-side check + admin privileges/SQL execution if needed, 
    // or better, ensure RLS allows Host to DELETE participants.

    // We need to fix RLS first if I want to be secure. 
    // Or, since I am using service role in some places? No, `createClient` uses user session.
    // I will check permissions in code for now.

    // Fetch event to check host
    const { data: event } = await supabase.from('events').select('host_id').eq('id', eventId).single()
    // Find group_no for handleHostSuccession
    const { data: participant } = await supabase
        .from('participants')
        .select('group_no')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .single()

    // 1. Check if user is event host OR room host for this participant's room
    if (!event) throw new Error('이벤트를 찾을 수 없습니다.')

    let canKick = event.host_id === user.id
    if (!canKick && participant?.group_no) {
        canKick = await checkIsRoomHost(eventId, participant.group_no)
    }

    if (!canKick) {
        throw new Error('강퇴 권한이 없습니다. (라운딩 개설자 또는 해당 조인방 호스트만 가능)')
    }

    // Release all held slots by this user
    await supabase
        .from('held_slots')
        .delete()
        .eq('event_id', eventId)
        .eq('held_by', targetUserId)

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)

    if (error) throw new Error('Failed to kick')

    // Host Succession
    if (participant?.group_no) {
        await handleHostSuccession(eventId, participant.group_no, targetUserId)
    }

    // Send kicked notification
    const { data: eventData } = await supabase.from('events').select('title').eq('id', eventId).single()
    if (eventData) {
        const { notifyKicked } = await import('@/actions/notification-actions')
        await notifyKicked(targetUserId, eventData.title)
    }

    revalidatePath(`/rounds/${eventId}`)
}

export async function preReserveEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if already joined
    const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (participant) {
        return { success: false, message: '이미 조인방에 참여 중입니다.' }
    }

    // Check if already reserved
    const { data: existing } = await supabase
        .from('pre_reservations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        return { success: false, message: '이미 사전예약 하셨습니다.' }
    }

    const { error } = await supabase
        .from('pre_reservations')
        .insert({
            event_id: eventId,
            user_id: user.id
        })

    if (error) {
        console.error('Pre-reservation error', error)
        throw new Error('Failed to pre-reserve')
    }

    // Atomically award 1 Manner Score
    const { error: updateError } = await supabase.rpc('update_user_scores', {
        target_user_id: user.id,
        manner_delta: 1
    })

    if (!updateError) {
        const { data: u } = await supabase.from('users').select('manner_score').eq('id', user.id).single()
        const newScore = u?.manner_score ?? 101
        
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
        const eventTitle = event?.title ? `'${event.title}' ` : ''

        try {
            // 1. Log History
            await supabase.from('manner_score_history').insert({
                user_id: user.id,
                amount: 1,
                description: `${eventTitle}사전예약 감사 보너스`,
                score_snapshot: newScore
            })

            // 2. Internal Notification
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'system',
                title: '매너점수 1점을 획득했습니다! 🏅',
                content: `${eventTitle}사전예약에 참여해주셔서 감사합니다.`,
                is_read: false
            })
        } catch (e) {
            console.error('Failed to log manner score or notify', e)
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '사전예약이 완료되었습니다. (매너점수 +1점)' }
}

export async function cancelPreReservation(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Delete pre-reservation
    const { error } = await supabase
        .from('pre_reservations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Cancel pre-reservation error', error)
        throw new Error('Failed to cancel pre-reservation')
    }

    // Atomically reclaim the 1 Manner Score reward
    const { error: updateError } = await supabase.rpc('update_user_scores', {
        target_user_id: user.id,
        manner_delta: -1
    })

    if (!updateError) {
        const { data: u } = await supabase.from('users').select('manner_score').eq('id', user.id).single()
        const newScore = u?.manner_score ?? 100
        
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
        const eventTitle = event?.title ? `'${event.title}' ` : ''

        try {
            // 1. Log History
            await supabase.from('manner_score_history').insert({
                user_id: user.id,
                amount: -1,
                description: `${eventTitle}사전예약 취소 (보너스 회수)`,
                score_snapshot: newScore
            })

            // 2. Internal Notification
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'system',
                title: '매너점수 1점이 회수되었습니다. ⚠️',
                content: `${eventTitle}사전예약 취소로 인해 지급되었던 보너스 점수가 차감되었습니다.`,
                is_read: false
            })
        } catch (e) {
            console.error('Failed to log manner score or notify', e)
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '사전예약이 취소되었습니다. (참여보너스 1점 회수)' }
}

// Handle expired participants (3-hour timer expired)

// Get the room host (first person to join a room)
export async function getRoomHost(eventId: string, groupNo: number) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('participants')
        .select('user_id, user:users(id, nickname, profile_img)')
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

    return data?.user_id || null
}

// Check if current user is the room host
export async function checkIsRoomHost(eventId: string, groupNo: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const hostUserId = await getRoomHost(eventId, groupNo)
    return hostUserId === user.id
}

// Hold a slot (room host or admin only)
export async function holdSlot(eventId: string, groupNo: number, slotIndex: number, invitedUserId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user is a participant in the event
    const { data: participant } = await supabase.from('participants').select('id, group_no').eq('event_id', eventId).eq('user_id', user.id).single()
    const { data: userData } = await supabase.from('users').select('is_admin, nickname').eq('id', user.id).single()
    const isAdmin = userData?.is_admin === true

    if (!participant && !isAdmin) throw new Error('조인방에 참가 중인 회원만 슬롯을 홀드할 수 있습니다.')

    // Check if user already held a slot in this event/room (history)
    const { data: history } = await supabase
        .from('held_slots_history')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
    
    if (history && !isAdmin) throw new Error('슬롯 홀드는 1회만 가능하며, 이미 사용하셨습니다.')

    // Check if slot is already held or occupied
    const { data: existingHold } = await supabase
        .from('held_slots')
        .select('id')
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .eq('slot_index', slotIndex)
        .single()

    if (existingHold) throw new Error('이미 홀드된 슬롯입니다.')

    // Insert hold
    const { error } = await supabase.from('held_slots').insert({
        event_id: eventId,
        group_no: groupNo,
        slot_index: slotIndex,
        held_by: user.id,
        invited_user_id: invitedUserId || null
    })

    if (error) {
        console.error('Hold slot error:', error)
        throw new Error('슬롯 홀드 실패')
    }

    // Record in history
    await supabase.from('held_slots_history').insert({
        user_id: user.id,
        event_id: eventId,
        group_no: groupNo,
        slot_index: slotIndex
    })

    // Send notification to the user who held the slot
    const { data: eventData } = await supabase.from('events').select('title').eq('id', eventId).single()
    if (eventData) {
        await supabase.from('notifications').insert({
            receiver_id: user.id,
            type: 'system',
            title: '슬롯 홀드 알림',
            content: `'${eventData.title}' ${groupNo}번방 슬롯을 홀드했습니다. 1시간 내에 '초대하기'를 통해 친구를 불러주세요. 이 홀드가 해제되거나 만료되면 다시 홀드할 수 없습니다.`,
            is_read: false
        })
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '슬롯을 홀드했습니다.' }
}

// Release a held slot (room host or admin only)
export async function releaseSlot(eventId: string, groupNo: number, slotIndex: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user is admin
    const { data: userData } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    const isAdmin = userData?.is_admin === true

    // For admins, allow deletion of any held slot
    // For regular hosts, only allow deletion of their own holds
    let query = supabase
        .from('held_slots')
        .delete()
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .eq('slot_index', slotIndex)

    if (!isAdmin) {
        query = query.eq('held_by', user.id)
    }

    const { error } = await query

    if (error) throw new Error('슬롯 홀드 해제 실패')

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '슬롯 홀드를 해제했습니다.' }
}

// Get held slots for an event
export async function getHeldSlots(eventId: string) {
    const supabase = await createClient()

    const { data: holds } = await supabase
        .from('held_slots')
        .select(`
            *,
            holder:users!held_slots_held_by_fkey(nickname)
        `)
        .eq('event_id', eventId)
        .gt('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()) // 1 hour expiry logic on server-side

    if (!holds || holds.length === 0) return []

    // Verify if holders are still participants
    const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('event_id', eventId)

    const participantIds = new Set(participants?.map(p => p.user_id) || [])

    // Filter out holds where the holder is not a participant
    // Exception: Maybe admins can hold without being participants? 
    // Usually admin holds are 'system' holds, but schema says 'held_by references users'.
    // If admin is not in room, can they hold? Prompt says "Room Host or Admin Only".
    // If Admin holds it, they might not be in the room. So we should KEEP holds by Admins.
    // So: Keep if held_by is in participants OR held_by is admin.
    
    // Check which holders are admins
    const holderIds = [...new Set(holds.map(h => h.held_by))]
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('id', holderIds)
        .eq('is_admin', true)
    
    const adminIds = new Set(admins?.map(a => a.id) || [])

    const validHolds = holds.filter(h => participantIds.has(h.held_by) || adminIds.has(h.held_by))
    
    // If validHolds.length < holds.length, we could auto-cleanup here or just return filtered.
    // Returning filtered fixes the UI.

    return validHolds
}

// Check if user can join a specific slot (handles held slots)
export async function canJoinSlot(eventId: string, groupNo: number, slotIndex: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check if slot is held
    const { data: hold } = await supabase
        .from('held_slots')
        .select('*')
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .eq('slot_index', slotIndex)
        .gt('created_at', new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()) // Check if still valid
        .single()

    if (!hold) return true // Not held, anyone can join

    // If held for specific user, only that user can join
    if (hold.invited_user_id) {
        return hold.invited_user_id === user.id
    }

    // If just held (no specific invite), no one can join except through invite
    return false
}

export async function handleHostSuccession(eventId: string, groupNo: number, leavingUserId: string) {
    const supabase = await createClient()

    // 1. Check if the leaving user was the host
    const currentHostId = await getRoomHost(eventId, groupNo)
    if (currentHostId !== leavingUserId) return

    // 2. End the current host session
    await supabase.from('host_history')
        .update({ ended_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .eq('user_id', leavingUserId)
        .is('ended_at', null)

    // 3. Find the next joiner in this room
    const { data: nextParticipant } = await supabase
        .from('participants')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .neq('user_id', leavingUserId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

    if (nextParticipant) {
        // 4. Make them the new host
        await supabase.from('host_history').insert({
            event_id: eventId,
            group_no: groupNo,
            user_id: nextParticipant.user_id,
        })

        // 5. Increment their host count
        const { data: userData } = await supabase.from('users').select('host_count').eq('id', nextParticipant.user_id).single()
        if (userData) {
            await supabase.from('users').update({
                host_count: (userData.host_count || 0) + 1
            }).eq('id', nextParticipant.user_id)
        }
    }
}

export async function moveRoom(eventId: string, targetGroupNo: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get current participant info
    const { data: participant } = await supabase
        .from('participants')
        .select('group_no')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
    
    if (!participant) throw new Error('참가 정보가 없습니다.')
    const oldGroupNo = participant.group_no || 1
    if (oldGroupNo === targetGroupNo) throw new Error('이미 같은 방에 있습니다.')

    // 2. Check if target group is full (Max 4)
    const { count: groupCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId)
        .eq('group_no', targetGroupNo)
    
    if (groupCount && groupCount >= 4) throw new Error(`${targetGroupNo}번 방은 이미 꽉 찼습니다.`)

    // 3. Update group_no
    const { error: updateError } = await supabase
        .from('participants')
        .update({ group_no: targetGroupNo })
        .eq('event_id', eventId)
        .eq('user_id', user.id)
    
    if (updateError) throw new Error('방 이동 실패')

    // 4. Release held slots in OLD group
    await supabase
        .from('held_slots')
        .delete()
        .eq('event_id', eventId)
        .eq('group_no', oldGroupNo)
        .eq('held_by', user.id)
    
    // 5. Host Succession in OLD group
    await handleHostSuccession(eventId, oldGroupNo, user.id)

    // 6. Check if user becomes host in NEW group (first joiner)
    if (groupCount === 0) {
         await supabase.from('host_history').insert({
             event_id: eventId,
             group_no: targetGroupNo,
             user_id: user.id
         })
         const { data: u } = await supabase.from('users').select('host_count').eq('id', user.id).single()
         if (u) {
            await supabase.from('users').update({ host_count: (u.host_count || 0) + 1 }).eq('id', user.id)
         }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: `${targetGroupNo}번 방으로 이동되었습니다.` }
}
