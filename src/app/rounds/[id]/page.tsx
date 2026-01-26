import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'



import RoundEntranceGuard from '@/components/rounds/round-entrance-guard'
import RoundRealtimeListener from '@/components/rounds/round-realtime-listener'
import RoundTabsContent from '@/components/rounds/round-tabs-content'

export default async function RoundDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // In Next.js 15+, params is a Promise. 
    // Wait for params to resolve before using params.id
    const { id } = await params;
    const { source, returnTo, fromTab } = await searchParams;

    const isFromProfile = source === 'profile';
    // If returning to profile, we need the member ID. If returnTo is provided, use it.
    // Also restore tab state and scroll position
    const backHref = isFromProfile && returnTo 
        ? `/members/${returnTo}?activeTab=${fromTab || 'pre'}&scrollTo=tabs` 
        : '/rounds';
    const headerMode = isFromProfile ? 'close' : 'back';


    const supabase = await createClient()

    // 1. Fetch Event Details from 'events' table
    const { data: event, error } = await supabase
        .from('events')
        .select(`
            *,
            host:users!events_host_id_fkey (id, nickname, profile_img, is_admin)
        `)
        .eq('id', id)
        .single()

    if (error || !event) {
        console.error('Error fetching event:', error)
        return notFound()
    }

    // 2. Fetch Participants from 'participants' table
    const { data: participants } = await supabase
        .from('participants')
        .select(`
            *,
            user:users (id, nickname, profile_img)
        `)
        .eq('event_id', id)

    // 3. Fetch Pre-reservations
    const { data: preReservations } = await supabase
        .from('pre_reservations')
        .select(`
            *,
            user:users (id, nickname, profile_img)
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true })

    const { data: { user } } = await supabase.auth.getUser()
    const currentUserParticipant = participants?.find(p => p.user_id === user?.id)
    const currentUserPreReservation = preReservations?.find(p => p.user_id === user?.id)

    let userStatus: 'none' | 'pre_reserved' | 'joined' = 'none'
    if (currentUserParticipant) {
        userStatus = 'joined'
    } else if (currentUserPreReservation) {
        userStatus = 'pre_reserved'
    }

    const isJoined = !!currentUserParticipant


    return (
        <>
            <RoundRealtimeListener eventId={id} />
            <div className="min-h-screen bg-[#121212] font-sans overflow-x-hidden">
                <RoundEntranceGuard 
                    status={userStatus}
                    paymentStatus={currentUserParticipant?.payment_status as 'paid' | 'unpaid' | null}
                    roomNumber={currentUserParticipant?.group_no}
                    joinedAt={currentUserParticipant?.joined_at}
                    paymentDeadlineHours={event.payment_deadline_hours}
                />

                {/* Dynamic Sticky Header */}
                <PremiumSubHeader
                    title={event.title}
                    backHref={backHref}
                    mode={headerMode}
                />

                {/* Content Padding for sticky header */}
                <div className="pt-[64px]"></div>

                {/* Main Content with Tabs */}
                <RoundTabsContent 
                    event={event}
                    participants={participants || []}
                    preReservations={preReservations || []}
                    userStatus={userStatus}
                    currentUser={user}
                    isJoined={isJoined}
                />
            </div>
        </>
    )
}
