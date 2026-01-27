'use client'

import { useState } from 'react'
import { sendLike } from '@/actions/relationship-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ConnectionRequestButtonProps {
    targetUserId: string
    distance: number
    connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'
    rejectionCount: number
    viewerMembershipLevel: string | null
    targetUserMembershipLevel: string | null
}

export default function ConnectionRequestButton({ 
    targetUserId, 
    distance, 
    connectionStatus,
    rejectionCount,
    viewerMembershipLevel,
    targetUserMembershipLevel
}: ConnectionRequestButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // 0. Red Member Check (Target)
    const normalizedLevel = targetUserMembershipLevel?.toUpperCase()
    const isTargetRed = normalizedLevel === 'RED' || !targetUserMembershipLevel;

    if (isTargetRed) {
        return (
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                    ⚠️ 신뢰하기 어려운 회원 (프로필 미완성)
                </span>
            </div>
        )
    }

    // 2. Logic for Button State (Viewer)
    const isViewerRed = (viewerMembershipLevel === 'RED' || !viewerMembershipLevel);

    const handleRequest = async () => {
        if (isViewerRed) {
            const confirmed = window.confirm('회원정보를 다 작성하지 않아 1촌 신청을 할 수 없습니다.\n회원정보 수정 페이지로 이동하시겠습니까?')
            if (confirmed) {
                router.push('/settings')
            }
            return
        }

        setLoading(true)
        try {
            await sendLike(targetUserId)
            toast.success('1촌 신청을 보냈습니다! 💌', { duration: 2000 })
            router.refresh()
        } catch (error) {
            console.error('Failed to send connection request:', error)
            // @ts-expect-error error is unknown
            toast.error(error.message || '신청 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // Handle Response (Accept/Reject)
    // We need import { acceptFriendRequest, rejectFriendRequest } calls here?
    // Since this is client component, we should probably add `rejectFriendRequest` to imports.
    // I'll assume they are available or I need to update imports.

    // Wait, imports are top of file. I need to make sure I update imports too.
    // But replace_file_content targets a block. I should probably replace the whole file content to be safe with imports.
    // Or just assume `sendLike` is there and I only add others.
    
    // Let's replace function content mostly. But I need `accept/reject` actions.
    // I'll assume the user will let me fix imports if broken, OR I'll update lines 4 to include them.

    /* State Rendering */

    // Left Logic text
    const distanceText = distance === 2 ? '2촌관계' : distance === 3 ? '3촌관계' : null
    
    if (connectionStatus === 'accepted' || distance === 1) {
        return (
            <div className="flex items-center gap-2">
                 <div className="text-blue-400 text-[12px] font-black px-3 py-1.5 rounded-xl bg-blue-400/10 border border-blue-400/20">
                    1촌관계 🤝
                </div>
            </div>
        )
    }

    if (connectionStatus === 'pending_sent') {
         return (
             <div className="flex items-center gap-2">
                {distanceText && <span className="text-[10px] text-gray-400 font-bold">{distanceText}</span>}
                <button disabled className="bg-gray-500/20 text-gray-400 text-[12px] font-black px-4 py-1.5 rounded-full cursor-not-allowed border border-white/5">
                    1촌신청중 ⏳
                </button>
            </div>
        )
    }

    if (connectionStatus === 'pending_received') {
        // Show Accept/Reject?
        // User said: "1촌신청확인하기를 누르면... 수락/거절 결정"
        // If I am here, I am checking their profile.
        // I should see buttons to Respond.
        return (
             <div className="flex items-center gap-2">
                {distanceText && <span className="text-[10px] text-gray-400 font-bold">{distanceText}</span>}
                <div className="flex gap-2">
                     <button 
                        onClick={async () => {
                            setLoading(true)
                            try {
                                const { acceptFriendRequest } = await import('@/actions/relationship-actions')
                                await acceptFriendRequest(targetUserId)
                                toast.success('1촌 신청을 수락했습니다!')
                            } catch(e) { toast.error('수락 실패') }
                            finally { setLoading(false); router.refresh() }
                        }}
                        disabled={loading}
                        className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-blue-600"
                    >
                        수락
                    </button>
                    <button 
                         onClick={async () => {
                            setLoading(true)
                             try {
                                const { rejectFriendRequest } = await import('@/actions/relationship-actions')
                                await rejectFriendRequest(targetUserId)
                                toast.error('1촌 신청을 거절했습니다.')
                            } catch(e) { toast.error('거절 실패') }
                            finally { setLoading(false); router.refresh() }
                        }}
                        disabled={loading}
                        className="bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-red-500/30"
                    >
                        거절
                    </button>
                </div>
            </div>
        )
    }

    if (connectionStatus === 'rejected') {
        // Check count
        if (rejectionCount >= 2) {
             return (
                <div className="flex items-center gap-2">
                    {distanceText && <span className="text-[10px] text-gray-400 font-bold">{distanceText}</span>}
                    <button disabled className="bg-black text-white/50 text-[12px] font-black px-4 py-1.5 rounded-full cursor-not-allowed border border-white/10">
                        1촌거절 ⛔
                    </button>
                </div>
            )
        } else {
             // Re-request (Red)
             return (
                <div className="flex items-center gap-2">
                    {distanceText && <span className="text-[10px] text-gray-400 font-bold">{distanceText}</span>}
                    <button
                        onClick={handleRequest}
                        disabled={loading}
                        className={`bg-red-600 text-white text-[12px] font-extrabold px-4 py-1.5 rounded-full hover:bg-red-700 transition-all active:scale-90 disabled:opacity-50 shadow-[0_4px_12px_rgba(220,38,38,0.4)]`}
                    >
                        {loading ? '처리중...' : '1촌재신청'}
                    </button>
                </div>
            )
        }
    }

    // Default: None
    return (
        <div className="flex items-center gap-2">
            {distanceText && <span className="text-[10px] text-gray-400 font-bold">{distanceText}</span>}
            <button
                onClick={handleRequest}
                disabled={loading}
                className={`bg-blue-500 text-white text-[12px] font-extrabold px-4 py-1.5 rounded-full hover:bg-blue-600 transition-all active:scale-90 disabled:opacity-50 shadow-[0_4px_12px_rgba(59,130,246,0.3)]`}
            >
                {loading ? '신청중...' : '1촌신청'}
            </button>
        </div>
    )
}
