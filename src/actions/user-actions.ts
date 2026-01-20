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
    return friends.filter((f: any) => f.distance === 1)
}
