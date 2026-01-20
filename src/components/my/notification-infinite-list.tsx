'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Bell, Heart, UserPlus, Info, CheckCircle2 } from 'lucide-react'

const PAGE_SIZE = 10

interface Notification {
    id: string;
    type: string;
    created_at: string;
    read_at: string | null;
    sender_id: string | null;
}

interface Sender {
    id: string;
    nickname: string | null;
    profile_img: string | null;
}

const notificationMessages: Record<string, string> = {
    'like_received': '님이 회원님을 좋아요 했습니다',
    'like_accepted': '님과 1촌이 되었습니다',
    'event_joined': '님이 라운딩에 참여했습니다',
    'event_kicked': '라운딩에서 제외되었습니다',
    'payment_confirmed': '결제가 확인되었습니다',
    'system': '시스템 알림입니다'
}

const getIcon = (type: string) => {
    switch (type) {
        case 'like_received': return <Heart size={14} className="text-pink-500" />
        case 'like_accepted': return <UserPlus size={14} className="text-blue-500" />
        case 'payment_confirmed': return <CheckCircle2 size={14} className="text-emerald-500" />
        default: return <Info size={14} className="text-white/40" />
    }
}

export default function NotificationInfiniteList() {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [senders, setSenders] = useState<Record<string, Sender>>({})
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const observerTarget = useRef<HTMLDivElement>(null)

    const fetchNotifications = useCallback(async (pageNum: number) => {
        if (loading || !hasMore) return

        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const { data: notifs } = await supabase
            .from('notifications')
            .select('id, type, created_at, read_at, sender_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

        if (notifs) {
            if (notifs.length < PAGE_SIZE) setHasMore(false)

            // Get sender details
            const senderIds = [...new Set(notifs.map((n: Notification) => n.sender_id).filter(Boolean) as string[])]
            if (senderIds.length > 0) {
                const { data: senderData } = await supabase
                    .from('users')
                    .select('id, nickname, profile_img')
                    .in('id', senderIds)

                if (senderData) {
                    setSenders(prev => {
                        const next = { ...prev }
                        senderData.forEach((s: Sender) => { next[s.id] = s })
                        return next
                    })
                }
            }

            setNotifications(prev => pageNum === 0 ? notifs : [...prev, ...notifs])
        }
        setLoading(false)
    }, [loading, hasMore, supabase])

    // Intersection Observer for scroll-based loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    // This will trigger for the first time too since observerTarget is in view initially
                    fetchNotifications(page)
                    setPage(prev => prev + 1)
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) observer.unobserve(currentTarget)
        }
    }, [fetchNotifications, loading, hasMore, page])

    return (
        <div className="space-y-1">
            {notifications.map((notif) => {
                const sender = senders[notif.sender_id || '']
                return (
                    <div
                        key={notif.id}
                        className="flex items-start gap-4 p-4 active:bg-white/5 transition-colors border-b border-white/[0.02]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden relative">
                            {sender?.profile_img ? (
                                <img src={sender.profile_img} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg">👤</span>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#121212] rounded-full flex items-center justify-center border border-white/5 scale-75">
                                {getIcon(notif.type)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[13px] text-white/80 leading-snug">
                                <span className="font-bold text-white">{sender?.nickname || '시스템'}</span>
                                <span className="ml-1 opacity-60">{notificationMessages[notif.type] || notif.type}</span>
                            </p>
                            <p className="text-[10px] text-white/20 mt-1 font-bold uppercase tracking-wider">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ko })}
                            </p>
                        </div>
                    </div>
                )
            })}

            {/* Observer Target & Loading Spinner */}
            <div ref={observerTarget} className="py-8 flex justify-center min-h-[60px]">
                {loading && (
                    <div className="w-5 h-5 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                )}
                {!hasMore && notifications.length > 0 && (
                    <div className="py-4 text-center">
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">End of Notifications</p>
                    </div>
                )}
                {!loading && !hasMore && notifications.length === 0 && (
                    <div className="py-12 text-center w-full">
                        <Bell size={32} className="mx-auto text-white/5 mb-4" />
                        <p className="text-white/20 font-bold text-sm">알림 내역이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
