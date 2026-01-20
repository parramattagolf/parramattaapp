'use client'

import { useState, useEffect } from 'react'
import { getFriends } from '@/actions/user-actions'

export default function InviteModal({ isOpen, onClose, onInvite }: { isOpen: boolean, onClose: () => void, onInvite: (userId: string) => void }) {
    const [friends, setFriends] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let isMounted = true
        if (isOpen) {
            setLoading(true)
            getFriends().then(data => {
                if (isMounted) {
                    setFriends(data)
                    setLoading(false)
                }
            })
        }
        return () => { isMounted = false }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm">
            <div className="bg-[var(--color-bg)] w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl p-6 h-[75vh] sm:h-auto flex flex-col border-x border-t sm:border border-[var(--color-divider)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)]">1촌 친구 초대</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-gray-100)] text-[var(--color-text-desc)]"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {loading ? (
                        <div className="text-center py-20 text-[var(--color-text-desc)] text-sm">로딩 중...</div>
                    ) : friends.length === 0 ? (
                        <div className="text-center py-20 text-[var(--color-text-desc)] text-sm opacity-50">초대할 1촌 친구가 없습니다.</div>
                    ) : (
                        friends.map(friend => (
                            <button
                                key={friend.id}
                                onClick={() => { onInvite(friend.id); onClose(); }}
                                className="w-full flex items-center gap-4 p-3 active:bg-[var(--color-surface-hover)] rounded-2xl transition-colors text-left border border-transparent active:border-[var(--color-divider)]"
                            >
                                <div className="w-12 h-12 bg-[var(--color-gray-100)] rounded-2xl overflow-hidden flex-shrink-0 border border-[var(--color-divider)]">
                                    {friend.profile_img ? (
                                        <img src={friend.profile_img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[var(--color-text-primary)] truncate">{friend.nickname}</div>
                                    <div className="text-xs text-[var(--color-text-desc)] truncate font-medium">{friend.job || '직업 미입력'}</div>
                                </div>
                                <span className="text-[11px] bg-blue-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-transform">
                                    초대하기
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
