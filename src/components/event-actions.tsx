'use client'

import { joinEvent, leaveEvent } from '@/actions/event-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function EventActions({ eventId, isJoined, isFull, isHost }: { eventId: string, isJoined: boolean, isFull: boolean, isHost: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleJoin = async () => {
        if (!confirm('참가하시겠습니까?')) return
        setLoading(true)
        try {
            await joinEvent(eventId)
            router.refresh()
        } catch (e) {
            alert('참가 실패: ' + e)
        } finally {
            setLoading(false)
        }
    }

    const handleLeave = async () => {
        if (!confirm('취소하시겠습니까?')) return
        setLoading(true)
        try {
            await leaveEvent(eventId)
            router.refresh()
        } catch (e) {
            alert('취소 실패')
        } finally {
            setLoading(false)
        }
    }

    if (isHost) {
        return (
            <button disabled className="w-full bg-gray-300 text-white font-bold py-4 rounded-xl cursor-not-allowed">
                방장입니다
            </button>
        )
    }

    if (isJoined) {
        return (
            <button onClick={handleLeave} disabled={loading} className="w-full bg-red-500 text-white font-bold py-4 rounded-xl">
                참가 취소하기
            </button>
        )
    }

    if (isFull) {
         return (
            <button disabled className="w-full bg-gray-300 text-white font-bold py-4 rounded-xl cursor-not-allowed">
                마감되었습니다
            </button>
        )
    }

    return (
        <button onClick={handleJoin} disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl">
            참가 신청하기
        </button>
    )
}
