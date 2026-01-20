'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendMessage(eventId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // RLS will enforce checking participants, but good to be safe or just let RLS handle it
    const { error } = await supabase.from('messages').insert({
        event_id: eventId,
        sender_id: user.id,
        content
    })

    if (error) {
        console.error('Send Check RLS', error)
        throw new Error('Failed to send message')
    }

    return { success: true }
}
