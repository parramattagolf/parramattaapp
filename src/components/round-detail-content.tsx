'use client'

import { useState, useEffect, useCallback } from 'react'
import { leaveEvent } from '@/actions/event-actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock } from 'lucide-react'

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

interface HeldSlot {
    id: string;
    event_id: string;
    group_no: number;
    slot_index: number;
    held_by: string;
    invited_user_id: string | null;
}

export default function RoundDetailContent({ event, participants, isHost, isJoined }: { event: Event, participants: Participant[], currentUser: User | null, isHost: boolean, isJoined: boolean }) {
    const [slots, setSlots] = useState<(Participant | null)[]>([])
    const [heldSlots, setHeldSlots] = useState<HeldSlot[]>([])
    const [roomHosts, setRoomHosts] = useState<Record<number, string>>({}) // groupNo -> userId
    const router = useRouter()
    const supabase = createClient()

    // Fetch held slots
    // Fetch held slots
    const fetchHeldSlots = useCallback(async () => {
        const { getHeldSlots } = await import('@/actions/event-actions')
        const data = await getHeldSlots(event.id)
        setHeldSlots(data || [])
    }, [event.id])

    useEffect(() => {
        fetchHeldSlots()
    }, [fetchHeldSlots, participants])

    useEffect(() => {
        const channel = supabase
            .channel('held_slots_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'held_slots',
                filter: `event_id=eq.${event.id}`
            }, () => {
                fetchHeldSlots()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, event.id, fetchHeldSlots])

    // Calculate room hosts (first joiner per room)
    useEffect(() => {
        const max = event.max_participants || 4
        const maxRooms = Math.ceil(max / 4)
        const hosts: Record<number, string> = {}

        for (let r = 1; r <= maxRooms; r++) {
            const roomMembers = participants
                .filter(p => (p.group_no || 1) === r)
                .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())

            if (roomMembers.length > 0) {
                hosts[r] = roomMembers[0].user_id
            }
        }
        setRoomHosts(hosts)
    }, [participants, event.max_participants])

    useEffect(() => {
        const max = event.max_participants || 4
        const filledSlots: (Participant | null)[] = []
        const maxRooms = Math.ceil(max / 4)

        for (let r = 1; r <= maxRooms; r++) {
            const roomMembers = participants.filter(p => (p.group_no || 1) === r)
            roomMembers.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())

            const slotsUsedBefore = (r - 1) * 4
            const slotsForThisRoom = Math.min(4, max - slotsUsedBefore)

            for (let s = 0; s < slotsForThisRoom; s++) {
                filledSlots.push(roomMembers[s] || null)
            }
        }

        setSlots(filledSlots)
    }, [participants, event.max_participants])

    useEffect(() => {
        const channel = supabase
            .channel('participants_change')
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
    }, [supabase, event.id, router])

    // Navigate to room detail page
    const navigateToRoom = (roomNumber: number) => {
        router.push(`/rounds/${event.id}/rooms/${roomNumber}`)
    }

    return (
        <div className="bg-[#121212]">
            {/* Split Compact View by Rooms */}
            <div className="space-y-8">
                {(() => {
                    const maxRooms = Math.ceil((event.max_participants || 4) / 4)
                    
                    // 1. Always show the first room
                    const roomsToShow = new Set<number>([0])
                    
                    // 2. Determine which rooms to show based on participation
                    // Show a room if it has participants OR if the previous room has participants
                    for (let i = 0; i < maxRooms; i++) {
                        const roomSlots = slots.slice(i * 4, (i + 1) * 4)
                        const hasMembers = roomSlots.some(s => s !== null)
                        
                        if (hasMembers) {
                            roomsToShow.add(i)
                            // If this room has members, the NEXT room should at least be visible as an option
                            if (i + 1 < maxRooms) {
                                roomsToShow.add(i + 1)
                            }
                        }
                    }

                    // 3. Ensure at least one room with an empty slot is shown (if not all full)
                    let sortedRoomIndices = Array.from(roomsToShow)
                        .filter(i => i < maxRooms)
                        .sort((a, b) => a - b)
                    
                    const lastShownIdx = sortedRoomIndices[sortedRoomIndices.length - 1]
                    const lastRoomSlots = slots.slice(lastShownIdx * 4, (lastShownIdx + 1) * 4)
                    const isLastRoomFull = lastRoomSlots.every(s => s !== null)
                    
                    if (isLastRoomFull && lastShownIdx + 1 < maxRooms) {
                        roomsToShow.add(lastShownIdx + 1)
                    }

                    // Sort and filter out of bounds
                    sortedRoomIndices = Array.from(roomsToShow)
                        .filter(i => i < maxRooms)
                        .sort((a, b) => a - b)

                    return sortedRoomIndices.map((roomIndex) => {
                        const roomSlots = slots.slice(roomIndex * 4, (roomIndex + 1) * 4)
                        const roomTitle = maxRooms === 1 ? '1번방 조인' : `${roomIndex + 1}번방 조인`

                        return (
                            <div key={roomIndex}>
                                <button
                                    type="button"
                                    onClick={() => navigateToRoom(roomIndex + 1)}
                                    className="relative z-10 cursor-pointer font-bold text-white/60 text-lg uppercase tracking-widest mb-4 hover:text-white transition-colors flex items-center gap-2 group/title"
                                >
                                    {roomTitle}
                                    {roomIndex === 0 && (
                                        <span className="ml-2 text-[11px] text-yellow-500 font-bold border border-yellow-500/30 px-2 py-0.5 rounded bg-yellow-500/10 animate-pulse align-middle">
                                            첫조인회원 10포인트 시상
                                        </span>
                                    )}
                                    {roomIndex === 1 && (
                                        <span className="ml-2 text-[11px] text-yellow-500 font-bold border border-yellow-500/30 px-2 py-0.5 rounded bg-yellow-500/10 animate-pulse align-middle">
                                            첫조인회원 5포인트 시상
                                        </span>
                                    )}
                                </button>

                                <div className="grid grid-cols-4 gap-2">
                                    {roomSlots.map((slot, idx) => {
                                        // Check if this slot is held
                                        const heldSlot = heldSlots.find(
                                            h => h.group_no === roomIndex + 1 && h.slot_index === idx
                                        )
                                        const isHeld = !!heldSlot

                                        return (
                                            <div
                                                key={roomIndex * 4 + idx}
                                                onClick={() => {
                                                    // Check if previous room is empty (Sequential Join Guidance)
                                                    if (roomIndex > 0) {
                                                        const prevRoomSlots = slots.slice((roomIndex - 1) * 4, roomIndex * 4);
                                                        const isPrevRoomEmpty = prevRoomSlots.every(s => s === null);
                                                        if (isPrevRoomEmpty && !slot) {
                                                            alert(`${roomIndex}번방이 비어있습니다. 순서대로 1번방부터 조인해 주세요.`);
                                                            return;
                                                        }
                                                    }
                                                    navigateToRoom(roomIndex + 1);
                                                }}
                                                className={`aspect-square rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center p-2 relative group overflow-hidden cursor-pointer ${slot
                                                    ? 'border-white/10 bg-[#1c1c1e] shadow-2xl scale-100'
                                                    : isHeld
                                                        ? 'border-dashed border-yellow-500/30 bg-yellow-500/5'
                                                        : 'border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                                                    }`}
                                            >
                                                {slot ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="w-10 h-10 bg-[#2c2c2e] rounded-xl mb-2 overflow-hidden border border-white/10 shadow-inner translate-y-0 group-hover:-translate-y-1 transition-transform active:scale-95 relative z-10">
                                                            {slot.user?.profile_img ? (
                                                                <div className="relative w-full h-full">
                                                                    <Image src={slot.user.profile_img} className="object-cover" alt="" fill unoptimized />
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xl opacity-20 grayscale">👤</div>
                                                            )}
                                                        </div>
                                                        <div className="text-center w-full px-1 relative z-10">
                                                            <div className="font-black text-[10px] text-white truncate tracking-tighter leading-none">{slot.user?.nickname}</div>

                                                            {slot.payment_status !== 'paid' && (
                                                                <div className="mt-1 bg-red-500/10 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-red-500/10 shadow-lg">
                                                                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Room Host Badge (first joiner) */}
                                                        {roomHosts[roomIndex + 1] === slot.user_id && (
                                                            <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[7px] font-black px-1 py-0.5 rounded-[3px] z-20 shadow-sm tracking-tighter">
                                                                방장
                                                            </div>
                                                        )}

                                                        {/* Event Creator indicator (blue dot) */}

                                                    </div>
                                                ) : isHeld ? (
                                                    // Held slot UI
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-yellow-500/50 gap-1">
                                                        <Lock size={20} className="text-yellow-500/40" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Reserved</span>
                                                    </div>
                                                ) : (
                                                    // Empty slot - click to go to room detail
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-1">
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                                                            <span className="text-xl font-extralight text-white/30">+</span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">Empty</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })
                })()}
            </div>

            {/* Fixed Bottom Action */}
            {isJoined && !isHost && (
                <div className="fixed bottom-0 w-full max-w-[500px] p-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent backdrop-blur-xl left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={async () => { if (confirm('참가 신청을 취소하시겠습니까?')) await leaveEvent(event.id) }}
                        className="w-full bg-[#1c1c1e] text-red-500 border border-red-500/20 font-black py-4.5 rounded-[22px] active:scale-[0.97] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] uppercase tracking-widest text-[13px]"
                    >
                        Cancel Participation
                    </button>
                </div>
            )}
        </div>
    )
}
