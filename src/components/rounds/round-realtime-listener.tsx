'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface RoundRealtimeListenerProps {
    eventId: string;
}

export default function RoundRealtimeListener({ eventId }: RoundRealtimeListenerProps) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Listen to all relevant tables for this specific event
        const channel = supabase
            .channel(`round_detail_${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'participants',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    console.log('Realtime update: participants changed')
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pre_reservations',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    console.log('Realtime update: pre_reservations changed')
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'held_slots',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    console.log('Realtime update: held_slots changed')
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId, supabase, router])

    return null
}
