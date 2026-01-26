import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'


import RoomDetailContent from '@/components/room-detail-content'
import PremiumSubHeader from '@/components/premium-sub-header'

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string, roomNumber: string }> }) {
    const { id, roomNumber } = await params
    const roomIndex = parseInt(roomNumber) - 1

    const supabase = await createClient()

    // 1. Fetch Event Details
    const { data: event, error } = await supabase
        .from('events')
        .select(`
            *,
            host:users!events_host_id_fkey (id, nickname, profile_img, is_admin)
        `)
        .eq('id', id)
        .single()

    if (error || !event) {
        return notFound()
    }

    // 2. Fetch Participants
    const { data: participants } = await supabase
        .from('participants')
        .select(`
            *,
            user:users (id, nickname, profile_img, job)
        `)
        .eq('event_id', id)

    const { data: { user } } = await supabase.auth.getUser()
    const isJoined = participants?.some(p => p.user_id === user?.id)

    // 3. Get Room Host
    const { getRoomHost } = await import('@/actions/event-actions')
    const roomHostId = await getRoomHost(id, parseInt(roomNumber))

    // Calculate room name

    return (
        <div className="min-h-screen bg-[#121212] font-sans pb-32">
            <PremiumSubHeader
                title={
                    <>
                        <span className="text-green-500 font-black">{roomNumber}번방</span>
                        <span className="ml-2">{event.title}</span>
                    </>
                }
                backHref={`/rounds/${id}?tab=brackets`}
            />

            <main className="px-6 pt-24 space-y-8 animate-fade-in">

                {/* Chat Section */}


                {/* Room Detail Content (Interactive Grid) */}
                <RoomDetailContent
                    event={event}
                    participants={participants || []}
                    currentUser={user as any}
                    roomHostId={roomHostId}
                    isRoomHost={user?.id === roomHostId}
                    isJoined={!!isJoined}
                    roomIndex={roomIndex}
                />
            </main>
        </div>
    )
}
