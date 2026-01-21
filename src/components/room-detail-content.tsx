'use client'

import { useState, useEffect } from 'react'
import { joinEvent, leaveEvent, kickParticipant, inviteParticipant } from '@/actions/event-actions'
import InviteModal from '@/components/invite-modal'
import JoinConfirmModal from '@/components/join-confirm-modal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Participant {
    id: string;
    user_id: string;
    event_id: string;
    joined_at: string;
    payment_status: string;
    group_no?: number;
    user: {
        id: string;
        nickname: string;
        profile_img: string;
        job?: string;
    }
}

interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    }
}

interface Event {
    id: string;
    host_id: string;
    max_participants: number;
}

export default function RoomDetailContent({
    event,
    participants,
    currentUser,
    isHost,
    isJoined,
    roomIndex
}: {
    event: Event,
    participants: Participant[],
    currentUser: User | null,
    isHost: boolean,
    isJoined: boolean,
    roomIndex: number
}) {
    const [slots, setSlots] = useState<(Participant | null)[]>([])
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

    useEffect(() => {
        // Filter participants by group_no (roomIndex is 0-based, group_no is 1-based)
        const roomNumber = roomIndex + 1
        const roomMembers = participants.filter(p => (p.group_no || 1) === roomNumber)

        // Sort by join time to keep stable order
        roomMembers.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())

        // Calculate how many slots this room should show
        const max = event.max_participants || 4
        const slotsUsedBefore = roomIndex * 4
        const slotsForThisRoom = Math.min(4, max - slotsUsedBefore)

        // Create slots for this room
        const roomSlots: (Participant | null)[] = []
        for (let i = 0; i < slotsForThisRoom; i++) {
            roomSlots.push(roomMembers[i] || null)
        }

        setSlots(roomSlots)
    }, [participants, roomIndex, event.max_participants])

    useEffect(() => {
        const channel = supabase
            .channel(`room_participants_${roomIndex}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'participants',
                filter: `event_id=eq.${event.id}`
            }, () => {
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, event.id, router, roomIndex])

    const handleJoin = async () => {
        setIsJoinModalOpen(true)
    }

    const confirmJoin = async () => {
        setIsJoinModalOpen(false)
        try {
            const roomNumber = roomIndex + 1
            await joinEvent(event.id, roomNumber)
        } catch (error) {
            console.error(error);
            alert('참가 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
        }
    }

    const handleInvite = async (friendId: string) => {
        setIsInviteOpen(false)
        try {
            const roomNumber = roomIndex + 1
            const result = await inviteParticipant(event.id, friendId, roomNumber)
            if (result.message) {
                alert(result.message)
            }
        } catch (e: unknown) {
            const error = e as Error;
            alert(error.message || '초대 실패')
        }
    }

    const handleKick = async (userId: string) => {
        if (!confirm('정말 내보내시겠습니까?')) return
        const formData = new FormData()
        formData.append('eventId', event.id)
        formData.append('userId', userId)
        await kickParticipant(formData)
    }

    const TimeDisplay = ({ joinedAt, onExpire }: { joinedAt: string, onExpire: () => void }) => {
        const [left, setLeft] = useState('')
        const [isExpired, setIsExpired] = useState(false)

        useEffect(() => {
            const checkExpiration = () => {
                const deadline = new Date(new Date(joinedAt).getTime() + 3 * 60 * 60 * 1000)
                const now = new Date()
                const diff = deadline.getTime() - now.getTime()

                if (diff <= 0) {
                    setLeft('만료됨')
                    if (!isExpired) {
                        setIsExpired(true)
                        onExpire()
                    }
                    return true
                } else {
                    const h = Math.floor(diff / (1000 * 60 * 60))
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const s = Math.floor((diff % (1000 * 60)) / 1000)
                    setLeft(`${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`)
                    return false
                }
            }

            // Check immediately
            if (checkExpiration()) return

            const timer = setInterval(() => {
                if (checkExpiration()) {
                    clearInterval(timer)
                }
            }, 1000)
            return () => clearInterval(timer)
        }, [joinedAt, isExpired, onExpire])

        return (
            <span className={`font-mono font-bold text-xs ${isExpired ? 'text-gray-500' : 'text-red-500'}`}>
                {left}
            </span>
        )
    }

    // Determine how many slots to actually render.
    // If event.max = 6, and this is Room 2 (indices 4,5,6,7). 
    // Participant indices 4, 5 are valid. 
    // 6, 7 are beyond max.
    // We should probably show them as disabled or hidden?
    // Or just render valid slots.



    return (
        <div>
            <div className="flex items-center mb-6 gap-2 w-full">
                {isJoined && (
                    <>
                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="flex-1 text-[11px] bg-blue-600 text-white py-3 rounded-2xl font-black border border-white/10 active:scale-95 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] tracking-widest uppercase"
                        >
                            초대하기
                        </button>
                        <button
                            onClick={() => alert('준비중입니다.')}
                            className="flex-1 text-[11px] bg-yellow-500 text-black py-3 rounded-2xl font-black border border-yellow-500/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(234,179,8,0.3)] tracking-tight hover:bg-yellow-400"
                        >
                            방옮기기
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm('정말 방을 나가시겠습니까?\n\n⚠️ 매너점수 10점이 차감됩니다.\n(다시 재신청은 가능합니다)')) {
                                    try {
                                        const result = await leaveEvent(event.id)
                                        if (result.message) {
                                            alert(result.message)
                                        }
                                    } catch {
                                        alert('방 나가기 실패')
                                    }
                                }
                            }}
                            className="flex-1 text-[11px] bg-red-600 text-white py-3 rounded-2xl font-black border border-red-500/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] tracking-tight hover:bg-red-500"
                        >
                            방나가기
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {slots.map((slot, i) => {
                    // Check if this slot index is truly valid within max_participants
                    const globalIndex = roomIndex * 4 + i
                    const isSlotValid = globalIndex < (event.max_participants || 4)

                    if (!isSlotValid) return null; // Don't render invalid slots

                    return (
                        <div
                            key={i}
                            className={`aspect-square rounded-[36px] border transition-all duration-500 flex flex-col items-center justify-center p-6 relative group overflow-hidden ${slot
                                ? 'border-white/10 bg-[#1c1c1e] shadow-2xl scale-100'
                                : 'border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                                }`}
                        >
                            {slot ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-16 h-16 bg-[#2c2c2e] rounded-[22px] mb-4 overflow-hidden border border-white/10 shadow-inner translate-y-0 group-hover:-translate-y-1 transition-transform active:scale-90 relative z-10">
                                        {slot.user?.profile_img ? (
                                            <img src={slot.user.profile_img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-20 grayscale">👤</div>
                                        )}
                                    </div>
                                    <div className="text-center w-full px-2 relative z-10">
                                        <div className="font-black text-[15px] text-white truncate tracking-tighter leading-none">{slot.user?.nickname}</div>
                                        {slot.user?.job && (
                                            <div className="text-[10px] text-white/30 font-black truncate uppercase tracking-[0.2em] mt-2 mb-1">{slot.user.job}</div>
                                        )}
                                        {slot.payment_status !== 'paid' && (
                                            <div className="mt-2 bg-red-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-red-500/10 shadow-lg">
                                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                                <TimeDisplay
                                                    joinedAt={slot.joined_at}
                                                    onExpire={async () => {
                                                        try {
                                                            const { expireParticipant } = await import('@/actions/event-actions')
                                                            await expireParticipant(event.id, slot.user_id)
                                                        } catch (e) {
                                                            console.error('Failed to expire participant:', e)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isHost && slot.user_id !== currentUser?.id && (
                                        <button
                                            onClick={() => handleKick(slot.user_id)}
                                            className="absolute top-4 right-4 text-white/10 hover:text-red-500 font-black p-2 text-2xl leading-none active:scale-75 transition-all z-20"
                                        >
                                            &times;
                                        </button>
                                    )}

                                    {slot.user_id === event.host_id && (
                                        <span className="absolute top-5 left-5 text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-md font-black shadow-[0_0_20px_rgba(59,130,246,0.6)] tracking-tighter uppercase z-20">Host</span>
                                    )}
                                </>
                            ) : (
                                <button
                                    disabled={isJoined || (participants.length >= event.max_participants)}
                                    onClick={handleJoin}
                                    className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3 active:bg-white/[0.05] active:scale-[0.94] transition-all rounded-[36px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                                        <span className="text-2xl font-extralight text-white/30">+</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">Available</span>
                                        {isJoined ? <span className="text-[9px] text-blue-500/40 font-black mt-2 tracking-widest uppercase">(JOINED)</span> : null}
                                    </div>
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onInvite={handleInvite}
                eventId={event.id}
            />

            <JoinConfirmModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onConfirm={confirmJoin}
            />
        </div>
    )
}
