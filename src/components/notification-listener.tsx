'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { acceptFriendRequest } from '@/actions/relationship-actions'
import { toast as sonnerToast } from 'sonner'

export default function NotificationListener() {
    const [toast, setToast] = useState<{ 
        id: string, 
        title: string, 
        content: string, 
        type: string, 
        senderId?: string,
        linkUrl?: string
    } | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const showToast = useCallback((noti: { 
        id: string; 
        title?: string | null; 
        content?: string | null; 
        type: string;
        sender_id?: string;
        link_url?: string;
    }) => {
        setToast({
            id: noti.id,
            title: noti.title || (noti.type === 'global' ? '공지사항' : '새 알림'),
            content: noti.content || '새로운 메세지가 도착했습니다.',
            type: noti.type,
            senderId: noti.sender_id,
            linkUrl: noti.link_url
        })
    }, [])

    // Auto hide effect - only if NOT a friend request (which needs action)
    useEffect(() => {
        if (toast && toast.type !== 'friend_request') {
            const timer = setTimeout(() => {
                setToast(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [toast])

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('realtime_notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, (payload: any) => {
                    const newNoti = payload.new

                    // Filter: 1. Global Announcement OR 2. Targeted to me
                    if (newNoti.type === 'global' || newNoti.receiver_id === user.id) {
                        showToast(newNoti)
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupRealtime()
    }, [supabase, showToast])

    const handleAccept = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!toast?.senderId) return

        try {
            await acceptFriendRequest(toast.senderId)
            sonnerToast.success('1촌 신청을 수락했습니다!')
            setToast(null)
            router.refresh()
        } catch (error) {
            console.error('Accept error:', error)
            sonnerToast.error('수락 처리에 실패했습니다.')
        }
    }

    if (!toast) return null

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] z-[200] animate-slide-up">
            <div
                onClick={() => {
                    if (toast.linkUrl) {
                        router.push(toast.linkUrl)
                    } else {
                        router.push('/notifications')
                    }
                    setToast(null)
                }}
                className="bg-[#1c1c1e] border border-white/10 rounded-[24px] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
            >
                <div className="flex items-start gap-4">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Bell size={20} className="text-blue-500" />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-[14px] font-black text-white mb-0.5 tracking-tight truncate">{toast.title}</h4>
                        <p className="text-[12px] text-white/40 leading-tight line-clamp-2">{toast.content}</p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setToast(null)
                        }}
                        className="text-white/20 hover:text-white shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Friend Request Action Buttons */}
                {toast.type === 'friend_request' && (
                    <div className="flex gap-2 pl-14">
                        <button
                            onClick={handleAccept}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                            수락하기
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setToast(null)
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold py-2 rounded-lg transition-colors"
                        >
                            나중에
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
