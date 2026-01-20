'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Bell, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

interface Notification {
    id: string
    type: 'global' | 'individual' | string
    title: string | null
    content: string | null
    is_read: boolean
    created_at: string
    receiver_id: string | null
    sender_id: string | null
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null) // user metadata is complex, any is okay for now or use User from supabase
    const supabase = createClient()

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
                    notifications.map((notif) => (
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
                                    <div className={`w-2 h-2 rounded-full ${notif.type === 'global' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                        }`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${notif.type === 'global' ? 'text-yellow-500' : 'text-blue-500'
                                        }`}>
                                        {notif.type === 'global' ? 'System Announcement' : 'Direct Message'}
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

                            {!notif.is_read && (
                                <div className="absolute top-5 right-5">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    ))
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
