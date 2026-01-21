'use client'

import { useState } from 'react'
import { preReserveEvent, cancelPreReservation } from '@/actions/event-actions'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

export default function PreReservationButton({ eventId, isReserved }: { eventId: string, isReserved: boolean }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleClick = async () => {
        if (isReserved) {
            if (!confirm('사전예약을 취소하시겠습니까?\n\n취소 시 매너점수 2점이 차감됩니다. 😢')) return

            setLoading(true)
            try {
                const result = await cancelPreReservation(eventId)
                if (result.success) {
                    alert(result.message)
                    router.refresh()
                } else {
                    alert('취소 실패')
                }
            } catch (e) {
                console.error(e)
                alert('오류가 발생했습니다.')
            } finally {
                setLoading(false)
            }
            return
        }

        const message = "아직 고민 중이신가요?\n부담 없이 사전예약을 먼저 해보세요.\n회원님을 기다리는 분들께 초대를 받으실 수도 있답니다.\n\n사전예약은 취소 패널티가 전혀 없으며,\n오히려 감사의 의미로 매너점수 1점을 드려요! 🎁\n\n지금 바로 사전예약 하시겠어요?";
        if (!confirm(message)) return

        setLoading(true)
        try {
            const result = await preReserveEvent(eventId)
            if (result.success) {
                alert(result.message)
                confetti({
                    particleCount: 100,
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
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                px-4 py-2 rounded-xl text-[11px] font-black tracking-tight transition-all active:scale-95 shadow-lg
                ${isReserved
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'}
            `}
        >
            {loading ? '처리중...' : (isReserved ? '예약취소' : '사전예약')}
        </button>
    )
}
