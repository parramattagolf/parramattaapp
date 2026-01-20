'use client'

import { useState, useEffect } from 'react'
import { joinEvent, leaveEvent, kickParticipant, inviteParticipant } from '@/actions/event-actions'
import InviteModal from '@/components/invite-modal'
import EventChat from '@/components/event-chat'
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

export default function RoundDetailContent({ event, participants, currentUser, isHost, isJoined }: { event: Event, participants: Participant[], currentUser: User | null, isHost: boolean, isJoined: boolean }) {
    const [slots, setSlots] = useState<(Participant | null)[]>([])
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const max = event.max_participants || 4
        const newSlots = Array.from({ length: max }).map((_, i) => {
            return participants[i] || null
        })
        setSlots(newSlots)
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

    return (
        <div className="bg-[#121212]">
            <div className="flex justify-between items-center mb-10 px-1">
                <div className="flex flex-col">
                    <h3 className="font-black text-white text-[16px] tracking-[0.2em] uppercase opacity-80 mb-1">Squad Members</h3>
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{participants.length} Active Participants</span>
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
                {slots.map((slot, i) => (
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
                                    <div className="text-[10px] text-white/30 font-black truncate uppercase tracking-[0.2em] mt-2 mb-1">{slot.user?.job || 'PRO MEMBER'}</div>
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
                ))}
            </div>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onInvite={handleInvite}
            />

            {/* Chat Section */}
            {isJoined && (
                <div className="mt-16 border-t border-white/5 pt-12 animate-fade-in">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-[13px] font-black text-white/60 uppercase tracking-[0.2em]">Strategy Radio</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">Live encrypted</span>
                    </div>
                    <EventChat
                        eventId={event.id}
                        currentUser={currentUser}
                        participants={participants}
                    />
                </div>
            )}

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
