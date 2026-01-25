'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import PremiumSubHeader from '@/components/premium-sub-header'
import Link from 'next/link'

import { format } from 'date-fns'
import { Trophy, Calendar, MapPin } from 'lucide-react'

interface EventData {
    id: string;
    title: string;
    start_date: string;
    course_name: string;
    // thumbnail_url removed as it does not exist
}

interface RoundData {
    joined_at: string;
    payment_status: string;
    events: EventData;
}

export default function MyRoundsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'current' | 'pre' | 'past'>('current')
    const [rounds, setRounds] = useState<RoundData[]>([])
    const [preReservations, setPreReservations] = useState<RoundData[]>([])

    useEffect(() => {
        const fetchRounds = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Participating Rounds
            const { data: participantsData } = await supabase
                .from('participants')
                .select(`
                    joined_at,
                    payment_status,
                    events (
                        id, 
                        title, 
                        start_date, 
                        course_name
                    )
                `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false })

            if (participantsData) {
                // Cast to unknown first to avoid deep type mismatch with Supabase auto-types
                setRounds(participantsData as unknown as RoundData[])
            }

            // 2. Fetch Pre-reservations
            const { data: preData } = await supabase
                .from('pre_reservations')
                .select(`
                    created_at,
                    events (
                        id, 
                        title, 
                        start_date, 
                        course_name
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            
            if (preData) {
                 // Cast to unknown first
                setPreReservations(preData as unknown as RoundData[])
            }

            setLoading(false)
        }

        fetchRounds()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredList = (() => {
        const now = new Date()
        if (activeTab === 'current') {
            return rounds.filter(r => new Date(r.events.start_date) >= now)
        }
        if (activeTab === 'past') {
            return rounds.filter(r => new Date(r.events.start_date) < now)
        }
        if (activeTab === 'pre') {
            return preReservations
        }
        return []
    })()

    const counts = {
        current: rounds.filter(r => new Date(r.events?.start_date) >= new Date()).length,
        past: rounds.filter(r => new Date(r.events?.start_date) < new Date()).length,
        pre: preReservations.length
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="" backHref="/my" />

            <div className="pt-24 px-5">
                {/* Tabs */}
                <div className="flex p-1 bg-[#1c1c1e] rounded-xl mb-6 border border-white/5">
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'past' ? 'bg-[#2c2c2e] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <span>지난</span>
                        <span className="text-[10px] opacity-60">{counts.past}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pre')}
                        className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'pre' ? 'bg-[#2c2c2e] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <span>사전예약</span>
                        <span className="text-[10px] opacity-60">{counts.pre}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'current' ? 'bg-[#2c2c2e] text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        <span>참가중</span>
                        <span className="text-[10px] opacity-60">{counts.current}</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {filteredList.length > 0 ? (
                        filteredList.map((item) => {
                            // Cast item to concrete type to access properties safely
                            const roundItem = item as RoundData;
                            const event = roundItem.events;
                            
                            // Safety check: if event is null (e.g. deleted event), skip rendering
                            if (!event) return null

                            // Pre-reservations don't have payment_status in this fetch context usually, or it's implicitly pending/none.
                            // Participants have payment_status.
                            const isPre = activeTab === 'pre'
                            
                            return (
                                <Link
                                    key={`${isPre ? 'pre' : 'part'}-${event.id}-${item.created_at || item.joined_at}`}
                                    href={`/rounds/${event.id}`}
                                    className="block bg-[#1c1c1e] border border-white/5 rounded-3xl overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="flex p-4 gap-4">
                                        <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0 relative">
                                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-white/10 to-white/5">⛳</div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isPre ? (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-purple-500/10 text-purple-400">
                                                        Pre-Reserved
                                                    </span>
                                                ) : (
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${item.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {item.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-white truncate text-base">{event.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-white/40">
                                                <div className="flex items-center gap-1 text-[11px] font-medium">
                                                    <Calendar size={12} />
                                                    <span>{format(new Date(event.start_date), 'yyyy.MM.dd')}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] font-medium truncate">
                                                    <MapPin size={12} />
                                                    <span className="truncate">{event.course_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="self-center text-white/10">
                                            <Trophy size={20} />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-[#1c1c1e] rounded-3xl flex items-center justify-center mx-auto mb-4 text-white/10">
                                <Calendar size={32} />
                            </div>
                            <p className="text-white/20 font-bold">
                                {activeTab === 'pre' ? '사전예약 내역이 없습니다.' : 
                                 activeTab === 'past' ? '지난 라운딩이 없습니다.' : '참여중인 라운딩이 없습니다.'}
                            </p>
                            {activeTab === 'current' && (
                                <Link href="/rounds" className="mt-4 inline-block text-blue-500 font-bold text-sm">라운딩 찾아보기 →</Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
