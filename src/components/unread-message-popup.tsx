'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkUnreadNotifications } from '@/actions/notification-actions'
import { X, Bell } from 'lucide-react'

export default function UnreadMessagePopup() {
    const [isVisible, setIsVisible] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkNotifications = async () => {
            // Check localStorage for last check time
            const lastCheck = localStorage.getItem('lastNotificationCheck')
            const now = Date.now()
            const TWELVE_HOURS = 12 * 60 * 60 * 1000

            // If checked recently (within 12 hours), skip
            if (lastCheck && (now - parseInt(lastCheck) < TWELVE_HOURS)) {
                return
            }

            // Check server for unread messages
            const { count } = await checkUnreadNotifications()

            if (count > 0) {
                setIsVisible(true)
                // Update last check time
                localStorage.setItem('lastNotificationCheck', now.toString())
            }
        }

        checkNotifications()
    }, [])

    if (!isVisible) return null

    const handleClose = () => {
        setIsVisible(false)
    }

    const handleGoToMessages = () => {
        setIsVisible(false)
        router.push('/notifications')
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
            <div className="bg-[#1E1E1E] w-full max-w-[320px] rounded-2xl p-6 shadow-2xl border border-white/10 relative transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-5 shadow-lg relative">
                        <Bell size={32} className="text-white fill-white/20" />
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1E1E1E]"></span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        중요한 메세지가 있어요!
                    </h3>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        확인하지 않은 알림이 있습니다.<br />
                        지금 바로 확인해보세요.
                    </p>

                    <button
                        onClick={handleGoToMessages}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3.5 rounded-xl transition-colors active:scale-[0.98]"
                    >
                        메세지 확인하기
                    </button>

                    <button
                        onClick={handleClose}
                        className="mt-3 text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4"
                    >
                        나중에 확인하기
                    </button>
                </div>
            </div>
        </div>
    )
}
