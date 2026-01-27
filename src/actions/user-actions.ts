'use server'

import { createClient } from '@/utils/supabase/server'

export async function getFriends() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch confirmed friends (distance = 1)
    // We can use the view or RPC, or just query relationships.
    // Querying relationships: status = 'accepted' ? 
    // Wait, the current logic for 1-chon might be simplified or rely on N-chon RPC.
    // Let's use RPC 'get_member_list_with_distance' with depth 1.

    const { data: friends, error } = await supabase.rpc('get_member_list_with_distance', {
        query_user_id: user.id,
        max_depth: 1
    })

    if (error) {
        console.error(error)
        return []
    }

    // Filter out self and ensure distance is 1 (RPC returns self at distance 0 sometimes or filtered? The code says depth<=max_depth)
    return friends.filter((f: { distance: number }) => f.distance === 1)
}

// Get pre-reservations for a specific event (excluding those already joined)
export async function getPreReservationsForInvite(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get pre-reservations for this event
    const { data: preReservations, error } = await supabase
        .from('pre_reservations')
        .select(`
            id,
            user:users (id, nickname, profile_img, job)
        `)
        .eq('event_id', eventId)
        .neq('user_id', user.id) // Exclude self

    if (error) {
        console.error('Error fetching pre-reservations:', error)
        return []
    }

    // Get already joined participants to filter them out
    const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('event_id', eventId)

    const joinedIds = new Set(participants?.map(p => p.user_id) || [])

    // Filter out those who already joined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (preReservations || []).filter((p: any) => !joinedIds.has(p.user?.id))
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Use Supabase Admin Client to delete user from Auth and clean up all data
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    
    // Check for Service Role Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error('Server configuration error: Service Role Key missing')
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 1. Hosted Events Cleanup
    // Get all events hosted by user
    const { data: hostedEvents } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('host_id', user.id)
    
    if (hostedEvents && hostedEvents.length > 0) {
        const eventIds = hostedEvents.map(e => e.id)
        
        // Delete participants of hosted events
        await supabaseAdmin
            .from('participants')
            .delete()
            .in('event_id', eventIds)

        // Delete pre_reservations of hosted events
        await supabaseAdmin
            .from('pre_reservations')
            .delete()
            .in('event_id', eventIds)

        // Delete the events themselves
        await supabaseAdmin
            .from('events')
            .delete()
            .in('id', eventIds)
    }

    // 2. Personal Data Cleanup (where user is participant/sender/receiver)
    
    // Delete participation (as guest)
    await supabaseAdmin
        .from('participants')
        .delete()
        .eq('user_id', user.id)

    // Delete pre-reservations (as guest)
    await supabaseAdmin
        .from('pre_reservations')
        .delete()
        .eq('user_id', user.id)

    // Delete relationships (both directions)
    await supabaseAdmin
        .from('relationships')
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    // Delete notifications (sent and received)
    await supabaseAdmin
        .from('notifications')
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    // Delete user tokens (Kakao, etc)
    await supabaseAdmin
        .from('user_tokens')
        .delete()
        .eq('user_id', user.id)

    // Delete public user profile (if not cascaded by auth)
    await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user.id)

    // 3. Delete Auth User & Add to Blocklist
    // Get Kakao ID first
    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('kakao_id, nickname, email')
        .eq('id', user.id)
        .single()
    
    // Insert into deleted_users (Blocklist)
    if (userData?.kakao_id) {
        await supabaseAdmin
            .from('deleted_users')
            .insert({
                kakao_id: userData.kakao_id,
                email: userData.email,
                nickname: userData.nickname
            })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
        console.error('Delete account error:', error)
        throw new Error('계정 삭제 실패')
    }

    return { success: true }
}
