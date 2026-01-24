'use client'

import { useState } from 'react'
import { preReserveEvent } from '@/actions/event-actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Check, CalendarCheck } from 'lucide-react'

interface PreReservationBannerProps {
    eventId: string
    onAction?: () => void
}

export default function PreReservationBanner({ eventId, onAction }: PreReservationBannerProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handlePreReserve = async () => {
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
                onAction?.()
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
        <div className="bg-[#1c1c1e] rounded-[32px] p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                        <CalendarCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tighter">사전예약하고 혜택받으세요! ⛳</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-8">
                    <BenefitItem text="취소패널티 없이, 매너점수 1점을 드려요" />
                    <BenefitItem text="기존 참여자들로부터 초대를 받을 수 있어요" />
                    <BenefitItem text="취소 시 수수료가 면제됩니다 (예약 확정 전)." />
                </div>

                <button 
                    onClick={handlePreReserve}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                     {loading ? '처리 중...' : '지금 바로 사전예약하기 🚀'}
                </button>
            </div>
        </div>
    )
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-4 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-[13px] text-white/80 font-bold tracking-tight">{text}</span>
        </div>
    )
}
