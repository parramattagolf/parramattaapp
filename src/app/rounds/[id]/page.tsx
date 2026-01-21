import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import RoundDetailContent from '@/components/round-detail-content'
import PremiumSubHeader from '@/components/premium-sub-header'
import RoundInfoCard from '@/components/round-info-card'
import EventChat from '@/components/event-chat'

export default async function RoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // In Next.js 15+, params is a Promise. 
    // Wait for params to resolve before using params.id
    const { id } = await params;

    const supabase = await createClient()

    // 1. Fetch Event Details from 'events' table
    const { data: event, error } = await supabase
        .from('events')
        .select(`
            *,
            host:users!events_host_id_fkey (id, nickname, profile_img, phone, is_admin)
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

    const { data: { user } } = await supabase.auth.getUser()
    const isJoined = participants?.some(p => p.user_id === user?.id)

    return (
        <div className="min-h-screen bg-[#121212] pb-32 font-sans overflow-x-hidden">
            {/* Dynamic Sticky Header */}
            <PremiumSubHeader
                title=""
                backHref="/rounds"
                rightElement={
                    <button className="bg-blue-600 text-[11px] font-black text-white px-4 py-2 rounded-xl active:scale-95 transition-transform shadow-[0_4px_12px_rgba(37,99,235,0.3)] tracking-tight">
                        사전예약
                    </button>
                }
            />
            {/* Dynamic Height Header */}
            <div className="relative min-h-[20rem] h-auto bg-gradient-to-b from-[#1c1c1e] via-[#121212] to-[#121212] flex flex-col justify-end overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay"></div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]"></div>

                {/* Event Art Placeholder (Minimalist) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl filter grayscale opacity-[0.03] transform scale-150 rotate-12 select-none pointer-events-none">⛳</div>

                <div className="relative z-10 animate-slide-up px-8 pb-12 pt-32">

                    <h1 className="text-3xl font-black text-white tracking-tighter leading-tight mb-4 drop-shadow-2xl">{event.title}</h1>
                    <p className="text-white/60 text-[14px] font-medium leading-relaxed max-w-2xl whitespace-pre-wrap">
                        {event.description}
                    </p>
                </div>
            </div>

            <main className="px-6 space-y-12">
                {/* Master Info Card (Client Component with Interaction) */}
                <RoundInfoCard event={event} participants={participants || []} />

                {/* Chat Section (Moved from Content) */}


                {/* Participant Management (Client Side) */}
                <div className="animate-fade-in [animation-delay:200ms]">
                    <RoundDetailContent
                        event={event}
                        participants={participants || []}
                        currentUser={user}
                        isHost={!!(user && event.host_id === user.id)}
                        isJoined={!!isJoined}
                    />
                </div>
            </main>
        </div>
    )
}
