'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/actions/chat-actions'

// @ts-ignore
export default function EventChat({ eventId, currentUser }: { eventId: string, currentUser: any, participants?: any }) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Fetch initial messages? Or just subscription?
    // Usually fetch recent 50 then subscribe.
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(nickname, profile_img)
                `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
        }

        fetchMessages()

        const channel = supabase
            .channel('event_chat')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `event_id=eq.${eventId}`
            }, async (payload) => {
                // Fetch sender info for the new message
                const { data: sender } = await supabase.from('users').select('nickname, profile_img').eq('id', payload.new.sender_id).single()
                const msg = { ...payload.new, sender }
                setMessages(prev => [...prev, msg])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        // Optimistic update could go here

        try {
            await sendMessage(eventId, newMessage)
            setNewMessage('')
        } catch (error) {
            console.error(error)
            alert('Failed to send')
        }
    }

    return (
        <div className="bg-[var(--color-bg)] h-[450px] flex flex-col pt-4">
            <h3 className="font-bold text-[var(--color-text-primary)] mb-4 px-1 flex items-center gap-2">
                <span className="text-lg">💬</span>
                라운딩 채팅
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="text-center text-[var(--color-text-desc)] text-[12px] py-10 opacity-50">첫 메시지를 남겨보세요!</div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && (
                                <div className="w-9 h-9 bg-[var(--color-gray-100)] rounded-xl overflow-hidden flex-shrink-0 border border-[var(--color-divider)]">
                                    {msg.sender?.profile_img ? (
                                        <img src={msg.sender.profile_img} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                    )}
                                </div>
                            )}
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isMe && <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold ml-1">{msg.sender?.nickname}</div>}
                                <div className={`p-2.5 px-3.5 rounded-2xl text-[14px] leading-snug shadow-sm ${isMe
                                        ? 'bg-[#FEE500] text-[#191919] rounded-tr-[2px]'
                                        : 'bg-[var(--color-gray-100)] text-[var(--color-text-primary)] rounded-tl-[2px] border border-[var(--color-divider)]'
                                    }`}>
                                    {msg.content}
                                </div>
                                <div className="text-[9px] text-[var(--color-text-desc)] mt-1 mx-1 opacity-50">
                                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 items-center bg-[var(--color-gray-100)] p-2 rounded-2xl border border-[var(--color-divider)]">
                <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 bg-transparent border-none px-3 py-1.5 text-[14px] text-[var(--color-text-primary)] focus:outline-none placeholder-[var(--color-text-desc)]"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[#FEE500] text-[#191919] w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:grayscale font-bold shadow-sm active:scale-95 transition-transform"
                >
                    ↑
                </button>
            </form>
        </div>
    )
}
