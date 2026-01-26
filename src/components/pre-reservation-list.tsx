'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cancelPreReservation } from '@/actions/event-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PreReservation {
    id: string;
    user: {
        id: string;
        nickname: string;
        profile_img: string | null;
    }
}

interface PreReservationListProps {
    reservations: PreReservation[];
    eventId?: string;
    isPreReserved?: boolean;
}

export default function PreReservationList({ reservations, eventId, isPreReserved }: PreReservationListProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (!reservations || reservations.length === 0) return null

    const handleCancel = async () => {
        if (!eventId || loading) return
        if (!confirm('사전예약을 취소하시겠습니까? (매너점수 -2점)')) return

        setLoading(true)
        try {
            const result = await cancelPreReservation(eventId)
            if (result.success) {
                alert(result.message)
                router.refresh()
            } else {
                alert(result.message)
            }
        } catch (e) {
            console.error(e)
            alert('오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-blue-400 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5">
                    <Sparkles size={10} className="text-blue-500 fill-blue-500/20" />
                    사전예약
                </h3>
                
                {isPreReserved && (
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? '처리 중...' : '사전예약취소'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-8 gap-2">
                {reservations.map((res) => (
                    <Link 
                        key={res.id} 
                        href={`/members/${res.user?.id}`}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                    >
                        <div className="w-full aspect-square rounded-xl bg-[#2c2c2e] border border-white/5 overflow-hidden relative shadow-md group-hover:border-blue-500/30 transition-colors">
                            {res.user?.profile_img ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={res.user.profile_img}
                                        alt={res.user.nickname}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-black">
                                    {res.user?.nickname?.slice(0, 1) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] text-white/40 font-bold truncate w-full text-center tracking-tight group-hover:text-white/60 transition-colors">
                            {res.user?.nickname}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
