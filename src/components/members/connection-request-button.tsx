'use client'

import { useState } from 'react'
import { sendLike } from '@/actions/relationship-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ConnectionRequestButtonProps {
    targetUserId: string
    isAlreadyFriend: boolean
    isPending: boolean
}

export default function ConnectionRequestButton({ targetUserId, isAlreadyFriend, isPending }: ConnectionRequestButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    if (isAlreadyFriend) {
        return (
            <div className="text-blue-400 text-[12px] font-black px-3 py-1.5 rounded-xl bg-blue-400/10 border border-blue-400/20">
                1촌 🤝
            </div>
        )
    }

    if (isPending) {
         return (
            <button disabled className="bg-gray-500/20 text-gray-400 text-[12px] font-black px-4 py-1.5 rounded-full cursor-not-allowed border border-white/5">
                신청됨 ⏳
            </button>
        )
    }

    const handleRequest = async () => {
        setLoading(true)
        try {
            await sendLike(targetUserId)
            toast.success('1촌 신청을 보냈습니다! 💌')
            router.refresh()
        } catch (error) {
            console.error('Failed to send connection request:', error)
            // @ts-expect-error error is unknown
            toast.error(error.message || '신청 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleRequest}
            disabled={loading}
            className={`bg-blue-500 text-white text-[12px] font-extrabold px-4 py-1.5 rounded-full hover:bg-blue-600 transition-all active:scale-90 disabled:opacity-50 shadow-[0_4px_12px_rgba(59,130,246,0.3)]`}
        >
            {loading ? '신청중...' : '1촌신청'}
        </button>
    )
}
