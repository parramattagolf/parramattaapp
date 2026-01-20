'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import PremiumSubHeader from '@/components/premium-sub-header'
import Link from 'next/link'
import { format } from 'date-fns'
import { Trophy, Calendar, MapPin, CheckCircle2, Clock } from 'lucide-react'

export default function MyRoundsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [rounds, setRounds] = useState<any[]>([])

    useEffect(() => {
        const fetchRounds = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('participants')
                .select(`
                    joined_at,
                    payment_status,
                    events (
                        id, 
                        title, 
                        start_date, 
                        course_name,
                        thumbnail_url
                    )
                `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false })

            if (data) {
                setRounds(data)
            }
            setLoading(false)
        }

        fetchRounds()
    }, [])

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

            <div className="pt-24 px-5 space-y-4">
                {rounds.length > 0 ? (
                    rounds.map((r: any) => {
                        const event = r.events
                        const isPast = new Date(event.start_date) < new Date()

                        return (
                            <Link
                                key={event.id}
                                href={`/rounds/${event.id}`}
                                className={`block bg-[#1c1c1e] border border-white/5 rounded-3xl overflow-hidden active:scale-[0.98] transition-all ${isPast ? 'opacity-80' : 'opacity-100'}`}
                            >
                                <div className="flex p-4 gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                                        {event.thumbnail_url ? (
                                            <img src={event.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-white/10 to-white/5">⛳</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${r.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {r.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
                                            </span>
                                            {isPast && (
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-white/10 text-white/40 rounded-md uppercase tracking-widest">Past</span>
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
                        <p className="text-white/20 font-bold">참여한 라운딩이 없습니다.</p>
                        <Link href="/rounds" className="mt-4 inline-block text-blue-500 font-bold text-sm">라운딩 찾아보기 →</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
