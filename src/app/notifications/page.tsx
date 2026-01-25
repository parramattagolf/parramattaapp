'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Bell, ArrowLeft, ChevronDown } from 'lucide-react'
import HoldTimer from '@/components/notifications/hold-timer'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    type: 'global' | 'individual' | 'invite' | string
    action_type: string | null
    title: string | null
    content: string | null
    is_read: boolean
    created_at: string
    receiver_id: string | null
    sender_id: string | null
    link_url: string | null
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [visibleCount, setVisibleCount] = useState(5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    const fetchNotifications = React.useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`receiver_id.eq.${userId},type.eq.global`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching notifications:', error)
            return
        }

        setNotifications(data || [])
    }, [supabase])

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                await fetchNotifications(user.id)
            }
            setLoading(false)
        }
        init()
    }, [supabase, fetchNotifications])

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            )
        }
    }

    const markAllAsRead = async () => {
        if (!user) return
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false)

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        }
    }

    const handleAcceptInvite = async (notif: Notification) => {
        await markAsRead(notif.id)
        if (notif.link_url) {
            router.push(notif.link_url)
        }
    }

    const getNotifStyle = (type: string) => {
        switch (type) {
            case 'global':
                return { dot: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]', label: 'text-yellow-500', labelText: '공지사항' }
            case 'invite':
                return { dot: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]', label: 'text-green-500', labelText: '초대' }
            default:
                return { dot: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', label: 'text-blue-500', labelText: '알림' }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans max-w-[500px] mx-auto">
            {/* Custom Header */}
            <div className="sticky top-0 z-[110] bg-[#121212]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/my" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-xl font-black text-white tracking-tighter">알림 센터</h1>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-[12px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                        모두 읽음
                    </button>
                )}
            </div>

            <div className="p-6 space-y-4">
                {notifications.length > 0 ? (
                    <>
                        {notifications.slice(0, visibleCount).map((notif) => {
                            const style = getNotifStyle(notif.type)
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    className={`relative p-5 rounded-[24px] border transition-all active:scale-[0.98] ${notif.is_read
                                        ? 'bg-[#1c1c1e]/50 border-white/5 opacity-60'
                                        : 'bg-[#1c1c1e] border-white/10 shadow-xl'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${style.label}`}>
                                                {style.labelText}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-white/20">
                                            {format(new Date(notif.created_at), 'MM.dd HH:mm')}
                                        </span>
                                    </div>

                                    <h3 className={`text-[15px] font-bold mb-1 tracking-tight ${notif.type === 'global' ? 'text-yellow-100/90' : 'text-white'
                                        }`}>
                                        {notif.title || (notif.type === 'global' ? '공지사항' : '알림')}
                                    </h3>
                                    <p className="text-[13px] text-white/40 leading-relaxed tracking-tight">
                                        {notif.content || '내용이 없습니다.'}
                                    </p>

                                    {/* Action Button for Invite Type */}
                                    {notif.type === 'invite' && notif.link_url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAcceptInvite(notif)
                                            }}
                                            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all"
                                        >
                                            조인방 확인해보고 결정하기
                                        </button>
                                    )}

                                    {/* Slot Hold Notification Actions */}
                                    {notif.title?.includes('슬롯 홀드 알림') && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-[12px] text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex justify-between items-center">
                                                <span className="font-bold">⏳ 홀드 만료까지</span>
                                                <HoldTimer createdAt={notif.created_at} />
                                            </div>
                                            {(() => {
                                                // Extract Room ID from content (e.g., '1번방')
                                                const text = (notif.title || '') + ' ' + (notif.content || '')
                                                const match = text.match(/(\d+)번방/)
                                                const roomId = match ? match[1] : null
                                                
                                                if (roomId) {
                                                    return (
                                                        <Link
                                                            href={`/rounds/${roomId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all"
                                                        >
                                                            해당 조인방으로 이동
                                                        </Link>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </div>
                                    )}

                                    {!notif.is_read && (
                                        <div className="absolute top-5 right-5">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {visibleCount < notifications.length && (
                            <button
                                onClick={() => setVisibleCount(prev => prev + 5)}
                                className="w-full py-4 bg-[#1c1c1e] border border-white/5 rounded-2xl text-white/50 font-bold text-sm hover:text-white hover:bg-[#2c2c2e] transition-all flex items-center justify-center gap-2"
                            >
                                <span>더보기</span>
                                <ChevronDown size={16} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="py-24 flex flex-col items-center text-center opacity-20">
                        <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mb-6">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">새로운 소식이 없습니다</h3>
                        <p className="text-sm">관리자로부터 전송된 최신 메세지가 보입니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
