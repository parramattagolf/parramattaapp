'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationListener() {
    const [toast, setToast] = useState<{ id: string, title: string, content: string } | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const showToast = useCallback((noti: { id: string; title?: string | null; content?: string | null; type: string }) => {
        setToast({
            id: noti.id,
            title: noti.title || (noti.type === 'global' ? '공지사항' : '새 알림'),
            content: noti.content || '새로운 메세지가 도착했습니다.'
        })

        // Auto hide after 5 seconds
        setTimeout(() => {
            setToast(null)
        }, 5000)
    }, [])

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

    if (!toast) return null

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] z-[200] animate-slide-up">
            <div
                onClick={() => {
                    router.push('/notifications')
                    setToast(null)
                }}
                className="bg-[#1c1c1e] border border-white/10 rounded-[24px] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-start gap-4 active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Bell size={20} className="text-blue-500" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-[14px] font-black text-white mb-0.5 tracking-tight truncate">{toast.title}</h4>
                    <p className="text-[12px] text-white/40 leading-tight truncate">{toast.content}</p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setToast(null)
                    }}
                    className="absolute top-4 right-4 text-white/20 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
