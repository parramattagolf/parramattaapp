'use client'

import { Sparkles, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cancelPreReservation, preReserveEvent } from '@/actions/event-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import confetti from 'canvas-confetti'

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
    userStatus?: 'none' | 'pre_reserved' | 'joined';
}

export default function PreReservationList({ reservations, eventId, isPreReserved, userStatus }: PreReservationListProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Show component if there are reservations OR if it's the personal status area
    if ((!reservations || reservations.length === 0) && !isPreReserved && userStatus !== 'none') return null
    if (!eventId) return null

    const showHelp = () => {
        alert(
            "🚀 사전예약 안내\n\n" +
            "사전예약은 아직 참여를 확정하진 않았지만, 참가를 희망하는 의사를 미리 밝히는 기능입니다.\n\n" +
            "• 매너점수 1점 시상\n" +
            "• 기존 참여자로부터 초대를 받을 수 있어요\n" +
            "• 취소 시 시상받은 1점은 다시 회수됩니다"
        );
    }

    const handleCancel = async () => {
        if (loading) return
        if (!confirm('사전예약을 취소하시겠습니까?')) return

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

    const handleApply = async () => {
        if (loading) return
        setLoading(true)
        try {
            const result = await preReserveEvent(eventId)
            if (result.success) {
                alert(result.message)
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#60a5fa', '#93c5fd']
                })
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
            <div className="mb-4 px-1 flex items-center gap-2">
                {isPreReserved ? (
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[11px] font-black px-4 py-2 rounded-full border border-red-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Sparkles size={10} className="text-red-500" />
                        {loading ? '처리 중...' : '사전예약취소'}
                    </button>
                ) : (
                    userStatus === 'none' && (
                        <button
                            onClick={handleApply}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-4 py-2 rounded-full shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Sparkles size={10} className="text-blue-200 fill-white" />
                            {loading ? '처리 중...' : '사전예약신청 🚀'}
                        </button>
                    )
                )}

                <button 
                    onClick={showHelp}
                    className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                    title="사전예약이란?"
                >
                    <HelpCircle size={16} />
                </button>
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
