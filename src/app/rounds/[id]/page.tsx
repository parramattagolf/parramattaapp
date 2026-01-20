import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import RoundDetailContent from '@/components/round-detail-content'
import PremiumSubHeader from '@/components/premium-sub-header'
import RoundCalendarSpotlight from '@/components/round-calendar-spotlight'

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
            host:users!events_host_id_fkey (id, nickname, profile_img, phone)
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
            {/* Premium Header - Toss/LPGA Fusion */}
            <div className="relative h-72 bg-gradient-to-b from-[#1c1c1e] via-[#121212] to-[#121212] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay"></div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]"></div>

                {/* Event Art Placeholder (Minimalist) */}
                <div className="text-8xl filter grayscale opacity-[0.03] transform scale-150 rotate-12 select-none pointer-events-none">⛳</div>

                <div className="absolute bottom-12 left-8 right-8 z-10 animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black bg-blue-600/90 text-white px-2.5 py-1 rounded-md uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            Premium Round
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter leading-tight mb-2 drop-shadow-2xl">{event.title}</h1>
                    <div className="flex items-center gap-2 text-white/40 text-[13px] font-bold uppercase tracking-widest">
                        <span className="text-blue-500 text-lg">📍</span> {event.location}
                    </div>
                </div>
            </div>

            <main className="px-6 space-y-12">
                {/* Master Info Card */}
                <div className="card-flat bg-[#1c1c1e] rounded-[32px] p-8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden animate-fade-in group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <span className="text-8xl select-none">INFO</span>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[16px] font-black text-white tracking-[0.2em] uppercase opacity-80">General Information</h2>
                        <div className="w-10 h-[2px] bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner">
                                <span className="text-xl">📅</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Scheduled Time</div>
                                <div className="text-[16px] font-black text-white/90 tracking-tight">
                                    {new Date(event.start_date).toLocaleString('ko-KR', {
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner">
                                <span className="text-xl">👑</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Hosted By</div>
                                <div className="text-[16px] font-black text-white/90 tracking-tight">
                                    {event.host?.nickname} <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded ml-2 uppercase">Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner">
                                <span className="text-xl">👥</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Current Capacity</div>
                                <div className="text-[16px] font-black text-white/90 tracking-tight">
                                    <span className="text-blue-500">{participants?.length || 0}</span>
                                    <span className="text-white/20 mx-2">/</span>
                                    <span>{event.max_participants || 4} Members</span>
                                </div>
                            </div>
                        </div>

                        {event.description && (
                            <div className="pt-8 border-t border-white/5">
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Official Notice</div>
                                <p className="text-white/60 leading-relaxed text-[15px] font-medium whitespace-pre-wrap tracking-tight">
                                    {event.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Spotlight */}
                <RoundCalendarSpotlight date={new Date(event.start_date)} />

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
