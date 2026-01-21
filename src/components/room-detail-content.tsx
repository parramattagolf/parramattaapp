'use client'

import { useState, useEffect } from 'react'
import { joinEvent, leaveEvent, kickParticipant, inviteParticipant } from '@/actions/event-actions'
import InviteModal from '@/components/invite-modal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Participant {
    id: string;
    user_id: string;
    event_id: string;
    joined_at: string;
    payment_status: string;
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

    useEffect(() => {
        // Calculate max participants for this specific room (usually 4)
        // But we need to map the global participants array to this room's slots.
        // The room has index `roomIndex`.
        // Slots for this room are indices: roomIndex*4 to (roomIndex+1)*4 - 1

        const startIdx = roomIndex * 4
        // const endIdx = (roomIndex + 1) * 4

        // However, we want to display 4 slots for the room.
        const roomSlots = Array.from({ length: 4 }).map((_, i) => {
            const globalIndex = startIdx + i
            // Check if this global index is within total event max participants?
            // If the last room is partial? Logic usually assumes multiples of 4 or just fills up.
            // The previous logic used `event.max_participants` to create the full array.

            if (globalIndex >= (event.max_participants || 4)) return null // Non-existent slot if partial? 
            // Actually, if max_participants is 6. Room 1 has 0,1,2,3. Room 2 has 4,5. Slots 6,7 are invalid.
            // But we usually show empty slots if they are "Available".
            // If the event max is 6, then slots 6 and 7 (indices) shouldn't be valid "Join" targets?
            // "Available" button implies you can join.
            // So we should only render slots up to max_participants.

            return participants[globalIndex] || null
        })

        // Correction: if the loop goes beyond max_participants, those slots should probably not be renderable as "Available", or just not rendered.
        // But visual consistency often demands a 4-grid.
        // Let's stick to: if index >= max_participants, render nothing (or a locked/hidden state).
        // But for now let's mimic the main view which slices `slots`.

        setSlots(roomSlots)

    }, [participants, event.max_participants, roomIndex])

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
        if (!confirm('빈 슬롯에 참가하시겠습니까? (결제 대기 상태로 입장합니다)')) return
        try {
            await joinEvent(event.id)
        } catch (error) {
            console.error(error);
            alert('참가 실패')
        }
    }

    const handleInvite = async (friendId: string) => {
        setIsInviteOpen(false)
        try {
            await inviteParticipant(event.id, friendId)
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

    const TimeDisplay = ({ joinedAt }: { joinedAt: string }) => {
        const [left, setLeft] = useState('')

        useEffect(() => {
            const timer = setInterval(() => {
                const deadline = new Date(new Date(joinedAt).getTime() + 3 * 60 * 60 * 1000)
                const now = new Date()
                const diff = deadline.getTime() - now.getTime()

                if (diff <= 0) {
                    setLeft('00:00:00')
                    clearInterval(timer)
                } else {
                    const h = Math.floor(diff / (1000 * 60 * 60))
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const s = Math.floor((diff % (1000 * 60)) / 1000)
                    setLeft(`${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`)
                }
            }, 1000)
            return () => clearInterval(timer)
        }, [joinedAt])

        return <span className="text-red-500 font-mono font-bold text-xs">{left}</span>
    }

    // Determine how many slots to actually render.
    // If event.max = 6, and this is Room 2 (indices 4,5,6,7). 
    // Participant indices 4, 5 are valid. 
    // 6, 7 are beyond max.
    // We should probably show them as disabled or hidden?
    // Or just render valid slots.

    // UI Header
    const activeCount = slots.filter(s => s).length

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h3 className="font-black text-white text-[16px] tracking-[0.2em] uppercase opacity-80 mb-1">Squad Members</h3>
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{activeCount} Active in Room</span>
                </div>
                {isJoined && (
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="text-[11px] bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black border border-white/10 active:scale-95 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] uppercase tracking-widest"
                    >
                        Invite Friends
                    </button>
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
                                                <TimeDisplay joinedAt={slot.joined_at} />
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
            />
        </div>
    )
}
