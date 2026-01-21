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

    // Award 10 points to Host (Founder/First Participant)
    const pointsAwarded = 10
    const { data: u } = await supabase.from('users').select('points').eq('id', user.id).single()
    if (u) {
        const newBalance = (u.points || 0) + pointsAwarded
        await supabase.from('users').update({ points: newBalance }).eq('id', user.id)

        try {
            await supabase.from('point_transactions').insert({
                user_id: user.id,
                amount: pointsAwarded,
                description: `'${title}' 방 개설 및 첫 참여 시상 (1번 조인방)`,
                balance_snapshot: newBalance
            })
        } catch (e) {
            console.error("Failed to log point transaction", e)
        }
    }

    revalidatePath('/rounds')
    redirect(`/rounds/${data.id}`)
}

export async function joinEvent(eventId: string, groupNo: number = 1) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if full (Global check)
    const { data: event } = await supabase.from('events').select('max_participants, title').eq('id', eventId).single()
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

    if (groupCount && groupCount >= 4) {
        throw new Error(`Room ${groupNo} is full`)
    }

    const { error } = await supabase.from('participants').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'joined',
        payment_status: 'pending',
        group_no: groupNo
    })

    if (error) throw new Error('Failed to join')

    // Award points logic
    // specific to group opening
    let pointsAwarded = 0
    // We already checked groupCount before insert (it was the count BEFORE I joined).
    // So if groupCount was 0, I am the first.
    if (groupCount === 0) {
        if (groupNo === 1) pointsAwarded = 10
        else if (groupNo === 2) pointsAwarded = 5

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

    if (pointsAwarded > 0) {
        const { data: u } = await supabase.from('users').select('points').eq('id', user.id).single()
        if (u) {
            const newBalance = (u.points || 0) + pointsAwarded

            // Update User Points
            await supabase.from('users').update({ points: newBalance }).eq('id', user.id)

            // Insert Transaction Log
            try {
                await supabase.from('point_transactions').insert({
                    user_id: user.id,
                    amount: pointsAwarded,
                    description: `'${event?.title}' ${groupNo}번 조인방 첫 참여 시상`,
                    balance_snapshot: newBalance
                })
            } catch (e) {
                console.error("Failed to log point transaction", e)
            }
        }
    }

    // If user was pre-reserved, remove from pre_reservations
    await supabase.from('pre_reservations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    // Send payment pending notification
    if (event) {
        const { notifyPaymentPending } = await import('@/actions/notification-actions')
        await notifyPaymentPending(user.id, event.title)
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, pointsAwarded }
}

export async function leaveEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get event title for logging
    const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
    const eventTitle = event?.title ? `'${event.title}' ` : ''

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) throw new Error('Failed to leave')

    // Deduct 10 Manner Score
    const { data: userData } = await supabase.from('users').select('manner_score').eq('id', user.id).single()
    if (userData) {
        const newScore = (userData.manner_score ?? 100) - 10
        await supabase.from('users').update({ manner_score: newScore }).eq('id', user.id)

        try {
            await supabase.from('manner_score_history').insert({
                user_id: user.id,
                amount: -10,
                description: `${eventTitle}조인 취소 위약금`,
                score_snapshot: newScore
            })
        } catch (e) {
            console.error('Failed to log manner score', e)
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '조인이 취소되었습니다. 매너점수 10점이 차감되었습니다. 다시 재신청은 가능합니다.' }
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

    // Improved invite message
    const inviteContent = roomNumber
        ? `"${event.title}" 라운딩 ${roomNumber}번방에 초대되었습니다. 호스트가 슬롯을 예약해두었습니다!`
        : `"${event.title}" 라운딩에 참가해보세요!`

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
        throw new Error('초대 알림 전송 실패')
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
    return { success: true, message: '초대 메시지를 전송했습니다.' }
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
    if (!event || event.host_id !== user.id) {
        throw new Error('Only host can kick')
    }

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)

    if (error) throw new Error('Failed to kick')

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

    // Award 1 Manner Score
    const { data: u } = await supabase.from('users').select('manner_score').eq('id', user.id).single()
    if (u) {
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
        const eventTitle = event?.title ? `'${event.title}' ` : ''

        const newScore = (u.manner_score ?? 100) + 1
        await supabase.from('users').update({ manner_score: newScore }).eq('id', user.id)

        try {
            await supabase.from('manner_score_history').insert({
                user_id: user.id,
                amount: 1,
                description: `${eventTitle}사전예약 감사 보너스`,
                score_snapshot: newScore
            })
        } catch (e) {
            console.error('Failed to log manner score', e)
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

    // Deduct 2 Manner Score
    const { data: u } = await supabase.from('users').select('manner_score').eq('id', user.id).single()
    if (u) {
        const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
        const eventTitle = event?.title ? `'${event.title}' ` : ''

        const newScore = (u.manner_score ?? 100) - 2
        await supabase.from('users').update({ manner_score: newScore }).eq('id', user.id)

        try {
            await supabase.from('manner_score_history').insert({
                user_id: user.id,
                amount: -2,
                description: `${eventTitle}사전예약 취소 위약금`,
                score_snapshot: newScore
            })
        } catch (e) {
            console.error('Failed to log manner score', e)
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '사전예약이 취소되었습니다. (매너점수 -2점)' }
}

// Handle expired participants (3-hour timer expired)
export async function expireParticipant(eventId: string, participantUserId: string) {
    const supabase = await createClient()

    // Get event and participant info
    const { data: event } = await supabase.from('events').select('title').eq('id', eventId).single()
    const eventTitle = event?.title || '라운딩'

    // Delete participant
    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', participantUserId)

    if (error) {
        console.error('Failed to expire participant:', error)
        return { success: false }
    }

    // Deduct 30 Manner Score and 30 Points
    const { data: userData } = await supabase
        .from('users')
        .select('manner_score, points')
        .eq('id', participantUserId)
        .single()

    if (userData) {
        const newMannerScore = (userData.manner_score ?? 100) - 30
        const newPoints = (userData.points || 0) - 30

        await supabase.from('users').update({
            manner_score: newMannerScore,
            points: newPoints
        }).eq('id', participantUserId)

        // Log manner score deduction
        try {
            await supabase.from('manner_score_history').insert({
                user_id: participantUserId,
                amount: -30,
                description: `'${eventTitle}' 결제시간 초과 위약금`,
                score_snapshot: newMannerScore
            })
        } catch (e) {
            console.error('Failed to log manner score', e)
        }

        // Log points deduction
        try {
            await supabase.from('point_transactions').insert({
                user_id: participantUserId,
                amount: -30,
                description: `'${eventTitle}' 결제시간 초과 위약금`,
                balance_snapshot: newPoints
            })
        } catch (e) {
            console.error('Failed to log point transaction', e)
        }

        // Send notification to user
        try {
            await supabase.from('notifications').insert({
                receiver_id: participantUserId,
                type: 'system',
                title: '결제 시간 초과',
                content: `'${eventTitle}' 라운딩의 결제 시간(3시간)이 만료되어 조인이 자동 취소되었습니다. 매너점수 30점, 포인트 30점이 차감되었습니다.`,
                is_read: false
            })
        } catch (e) {
            console.error('Failed to send notification', e)
        }
    }

    revalidatePath(`/rounds/${eventId}`)
    return { success: true }
}

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

// Hold a slot (room host only)
export async function holdSlot(eventId: string, groupNo: number, slotIndex: number, invitedUserId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if user is room host
    const isHost = await checkIsRoomHost(eventId, groupNo)
    if (!isHost) throw new Error('조인방 호스트만 슬롯을 홀드할 수 있습니다.')

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

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '슬롯을 홀드했습니다.' }
}

// Release a held slot (room host only)
export async function releaseSlot(eventId: string, groupNo: number, slotIndex: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('held_slots')
        .delete()
        .eq('event_id', eventId)
        .eq('group_no', groupNo)
        .eq('slot_index', slotIndex)
        .eq('held_by', user.id)

    if (error) throw new Error('슬롯 홀드 해제 실패')

    revalidatePath(`/rounds/${eventId}`)
    return { success: true, message: '슬롯 홀드를 해제했습니다.' }
}

// Get held slots for an event
export async function getHeldSlots(eventId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('held_slots')
        .select('*')
        .eq('event_id', eventId)

    return data || []
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
        .single()

    if (!hold) return true // Not held, anyone can join

    // If held for specific user, only that user can join
    if (hold.invited_user_id) {
        return hold.invited_user_id === user.id
    }

    // If just held (no specific invite), no one can join except through invite
    return false
}
