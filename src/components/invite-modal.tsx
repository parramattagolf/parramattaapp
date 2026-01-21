'use client'

import { useState, useEffect } from 'react'
import { getFriends, getPreReservationsForInvite } from '@/actions/user-actions'

interface InvitableUser {
    id: string
    nickname: string
    profile_img: string | null
    job?: string
    type: 'pre_reservation' | 'friend'
}

export default function InviteModal({
    isOpen,
    onClose,
    onInvite,
    eventId
}: {
    isOpen: boolean
    onClose: () => void
    onInvite: (userId: string) => void
    eventId: string
}) {
    const [invitableUsers, setInvitableUsers] = useState<InvitableUser[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let isMounted = true
        if (isOpen && eventId) {
            setLoading(true)
            Promise.all([
                getFriends(),
                getPreReservationsForInvite(eventId)
            ]).then(([friends, preReservations]) => {
                if (isMounted) {
                    // Combine and deduplicate
                    const preResUsers: InvitableUser[] = preReservations.map((p: any) => ({
                        id: p.user.id,
                        nickname: p.user.nickname,
                        profile_img: p.user.profile_img,
                        job: p.user.job,
                        type: 'pre_reservation' as const
                    }))

                    const friendUsers: InvitableUser[] = friends.map((f: any) => ({
                        id: f.id,
                        nickname: f.nickname,
                        profile_img: f.profile_img,
                        job: f.job,
                        type: 'friend' as const
                    }))

                    // Deduplicate: if someone is both pre-reserved and a friend, show as pre_reservation
                    const preResIds = new Set(preResUsers.map(u => u.id))
                    const uniqueFriends = friendUsers.filter(f => !preResIds.has(f.id))

                    setInvitableUsers([...preResUsers, ...uniqueFriends])
                    setLoading(false)
                }
            })
        }
        return () => { isMounted = false }
    }, [isOpen, eventId])

    if (!isOpen) return null

    const preReservations = invitableUsers.filter(u => u.type === 'pre_reservation')
    const friends = invitableUsers.filter(u => u.type === 'friend')

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm">
            <div className="bg-[var(--color-bg)] w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl p-6 h-[75vh] sm:h-auto flex flex-col border-x border-t sm:border border-[var(--color-divider)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)]">친구 초대</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-gray-100)] text-[var(--color-text-desc)]"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide">
                    {loading ? (
                        <div className="text-center py-20 text-[var(--color-text-desc)] text-sm">로딩 중...</div>
                    ) : invitableUsers.length === 0 ? (
                        <div className="text-center py-20 text-[var(--color-text-desc)] text-sm opacity-50">
                            초대할 수 있는 친구가 없습니다.
                        </div>
                    ) : (
                        <>
                            {/* Pre-Reservations Section */}
                            {preReservations.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                        사전예약자
                                    </h4>
                                    <div className="space-y-2">
                                        {preReservations.map(user => (
                                            <UserRow key={user.id} user={user} onInvite={onInvite} onClose={onClose} badgeColor="yellow" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Friends Section */}
                            {friends.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        1촌 친구
                                    </h4>
                                    <div className="space-y-2">
                                        {friends.map(user => (
                                            <UserRow key={user.id} user={user} onInvite={onInvite} onClose={onClose} badgeColor="blue" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function UserRow({
    user,
    onInvite,
    onClose,
    badgeColor
}: {
    user: InvitableUser
    onInvite: (userId: string) => void
    onClose: () => void
    badgeColor: 'yellow' | 'blue'
}) {
    return (
        <button
            onClick={() => { onInvite(user.id); onClose(); }}
            className="w-full flex items-center gap-4 p-3 active:bg-[var(--color-surface-hover)] rounded-2xl transition-colors text-left border border-transparent active:border-[var(--color-divider)]"
        >
            <div className="w-12 h-12 bg-[var(--color-gray-100)] rounded-2xl overflow-hidden flex-shrink-0 border border-[var(--color-divider)]">
                {user.profile_img ? (
                    <img src={user.profile_img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--color-text-primary)] truncate">{user.nickname}</div>
                <div className="text-xs text-[var(--color-text-desc)] truncate font-medium">{user.job || '직업 미입력'}</div>
            </div>
            <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition-transform ${badgeColor === 'yellow'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-blue-500 text-white'
                }`}>
                초대하기
            </span>
        </button>
    )
}
