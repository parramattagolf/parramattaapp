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
            if (!confirm('사전예약을 취소하시겠습니까?\n\n취소 시 보너스로 받은 매너점수 1점이 회수됩니다. 😢')) return

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

        if (!isReserved) {
            // No confirmation needed for pre-reservation
        }

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
            {loading ? '처리중...' : (isReserved ? '사전예약취소' : '사전예약')}
        </button>
    )
}
