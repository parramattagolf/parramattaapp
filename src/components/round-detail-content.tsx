'use client'

import { useState, useEffect } from 'react'
import { joinEvent, leaveEvent, kickParticipant, inviteParticipant, holdSlot, releaseSlot } from '@/actions/event-actions'
import InviteModal from '@/components/invite-modal'
import Link from 'next/link'
import JoinConfirmModal from '@/components/join-confirm-modal'
import RoomInfoPopup from '@/components/room-info-popup'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Lock, Unlock } from 'lucide-react'

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

export default function RoundDetailContent({ event, participants, currentUser, isHost, isJoined }: { event: Event, participants: Participant[], currentUser: User | null, isHost: boolean, isJoined: boolean }) {
    const [slots, setSlots] = useState<(Participant | null)[]>([])
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [targetGroupNo, setTargetGroupNo] = useState<number>(1)
    const [showInfoPopup, setShowInfoPopup] = useState(false)
    const [heldSlots, setHeldSlots] = useState<HeldSlot[]>([])
    const [roomHosts, setRoomHosts] = useState<Record<number, string>>({}) // groupNo -> userId
    const router = useRouter()
    const supabase = createClient()

    // Show info popup on first visit
    useEffect(() => {
        const hasSeenPopup = localStorage.getItem('hasSeenRoundInfoPopup')
        if (!hasSeenPopup) {
            setShowInfoPopup(true)
            localStorage.setItem('hasSeenRoundInfoPopup', 'true')
        }
    }, [])

    // Fetch held slots
    useEffect(() => {
        const fetchHeldSlots = async () => {
            const { data } = await supabase
                .from('held_slots')
                .select('*')
                .eq('event_id', event.id)
            setHeldSlots(data || [])
        }
        fetchHeldSlots()

        // Subscribe to changes
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
    }, [supabase, event.id])

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
        // Logic to distribute participants into rooms based on group_no
        // If group_no is null (legacy), we might default to 1 or try to infer. 
        // For now, default to 1 to ensure visibility.

        const filledSlots: (Participant | null)[] = []
        const maxRooms = Math.ceil(max / 4)

        for (let r = 1; r <= maxRooms; r++) {
            // Get participants for this room
            // Filter by group_no if present, or fallback to room 1 for legacy data without group_no
            const roomMembers = participants.filter(p => (p.group_no || 1) === r)

            // Sort by join time to keep stable order
            roomMembers.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())

            // Calculate how many slots this room should show
            // Last room may have fewer slots if max_participants is not multiple of 4
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

    const handleJoin = async (groupNo: number) => {
        setTargetGroupNo(groupNo)
        setIsJoinModalOpen(true)
    }

    const confirmJoin = async () => {
        setIsJoinModalOpen(false)
        try {
            const result = await joinEvent(event.id, targetGroupNo)
            if (result && result.pointsAwarded) {
                alert(`축하합니다. ${result.pointsAwarded}포인트가 시상되었습니다`)
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
                })
            }
        } catch (error) {
            console.error(error);
            alert('참가 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
        }
    }

    const handleInvite = async (friendId: string) => {
        setIsInviteOpen(false)
        try {
            const result = await inviteParticipant(event.id, friendId)
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

    return (
        <div className="bg-[#121212]">
            {/* Split Compact View by Rooms */}
            <div className="space-y-8">
                {(() => {
                    const maxRooms = Math.ceil((event.max_participants || 4) / 4)
                    let lastOccupiedRoomIndex = -1

                    for (let i = 0; i < maxRooms; i++) {
                        const roomSlots = slots.slice(i * 4, (i + 1) * 4)
                        if (roomSlots.some(s => s !== null)) {
                            lastOccupiedRoomIndex = i
                        }
                    }

                    const roomsToShow = Math.min(lastOccupiedRoomIndex + 2, maxRooms)

                    return Array.from({ length: roomsToShow }).map((_, roomIndex) => {
                        const roomSlots = slots.slice(roomIndex * 4, (roomIndex + 1) * 4)
                        const roomTitle = maxRooms === 1 ? '1번방 조인' : `${roomIndex + 1}번방 조인`

                        return (
                            <div key={roomIndex}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/rounds/${event.id}/rooms/${roomIndex + 1}`)}
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
                                        const isRoomHost = roomHosts[roomIndex + 1] === currentUser?.id
                                        const canJoinHeld = heldSlot?.invited_user_id === currentUser?.id

                                        return (
                                            <div
                                                key={roomIndex * 4 + idx}
                                                className={`aspect-square rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center p-2 relative group overflow-hidden ${slot
                                                    ? 'border-white/10 bg-[#1c1c1e] shadow-2xl scale-100'
                                                    : isHeld
                                                        ? 'border-dashed border-yellow-500/30 bg-yellow-500/5'
                                                        : 'border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                                                    }`}
                                            >
                                                {slot ? (
                                                    <div
                                                        onClick={() => router.push(`/rounds/${event.id}/rooms/${roomIndex + 1}`)}
                                                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="w-10 h-10 bg-[#2c2c2e] rounded-xl mb-2 overflow-hidden border border-white/10 shadow-inner translate-y-0 group-hover:-translate-y-1 transition-transform active:scale-90 relative z-10">
                                                            {slot.user?.profile_img ? (
                                                                <img src={slot.user.profile_img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xl opacity-20 grayscale">👤</div>
                                                            )}
                                                        </div>
                                                        <div className="text-center w-full px-1 relative z-10">
                                                            <div className="font-black text-[10px] text-white truncate tracking-tighter leading-none">{slot.user?.nickname}</div>
                                                            {slot.user?.job && (
                                                                <div className="text-[8px] text-white/30 font-black truncate uppercase tracking-[0.2em] mt-1 hidden sm:block">{slot.user.job}</div>
                                                            )}
                                                            {slot.payment_status !== 'paid' && (
                                                                <div className="mt-1 bg-red-500/10 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-red-500/10 shadow-lg">
                                                                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Room Host Badge (first joiner) */}
                                                        {roomHosts[roomIndex + 1] === slot.user_id && (
                                                            <span className="absolute top-1 left-1 text-[8px] bg-yellow-500/20 text-yellow-500 px-1 py-0.5 rounded font-bold z-20">👑</span>
                                                        )}

                                                        {/* Event Creator indicator (blue dot) */}
                                                        {slot.user_id === event.host_id && (
                                                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"></span>
                                                        )}
                                                    </div>
                                                ) : isHeld && !canJoinHeld ? (
                                                    // Held slot UI (not for this user)
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-yellow-500/50 gap-1">
                                                        <Lock size={20} className="text-yellow-500/40" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Reserved</span>
                                                        {isRoomHost && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await releaseSlot(event.id, roomIndex + 1, idx)
                                                                    } catch (e) {
                                                                        console.error(e)
                                                                    }
                                                                }}
                                                                className="mt-1 text-[8px] text-red-400 underline"
                                                            >
                                                                홀드 해제
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Empty slot or held for this user
                                                    <button
                                                        disabled={isJoined || (participants.length >= event.max_participants) || (isHeld && !canJoinHeld)}
                                                        onClick={() => handleJoin(roomIndex + 1)}
                                                        className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-1 active:bg-white/[0.05] active:scale-[0.94] transition-all rounded-2xl"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                                                            <span className="text-xl font-extralight text-white/30">+</span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">
                                                                {canJoinHeld ? '초대됨' : 'Empty'}
                                                            </span>
                                                            {isJoined ? <span className="text-[8px] text-blue-500/40 font-black mt-0.5 tracking-widest uppercase">(JOINED)</span> : null}
                                                            {isRoomHost && !isHeld && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        try {
                                                                            await holdSlot(event.id, roomIndex + 1, idx)
                                                                        } catch (err) {
                                                                            alert((err as Error).message)
                                                                        }
                                                                    }}
                                                                    className="mt-1 text-[8px] text-yellow-500 flex items-center gap-0.5"
                                                                >
                                                                    <Lock size={10} /> 홀드
                                                                </button>
                                                            )}
                                                        </div>
                                                    </button>
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

            {/* Room Info Popup */}
            <RoomInfoPopup
                isOpen={showInfoPopup}
                onClose={() => setShowInfoPopup(false)}
            />

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
