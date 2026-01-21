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
