'use client'

import { useState, useEffect } from 'react'
import { X, Check, AlertCircle, Search, CalendarCheck } from 'lucide-react'

interface RoundEntranceGuardProps {
    status: 'none' | 'pre_reserved' | 'joined'
    paymentStatus?: 'paid' | 'unpaid' | null
    roomNumber?: number | null
    joinedAt?: string | null
    paymentDeadlineHours?: number
}

export default function RoundEntranceGuard({
    status,
    paymentStatus,
    roomNumber,
    joinedAt,
    paymentDeadlineHours = 3 // Default 3 hours
}: RoundEntranceGuardProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Show modal on mount (entry) with slight delay for animation
        const timer = setTimeout(() => {
            setIsOpen(true)
        }, 300)
        return () => clearTimeout(timer)
    }, [])

    if (!isOpen) return null

    const closeModal = () => setIsOpen(false)

    // Calculate remaining time for unpaid users
    const getRemainingTime = () => {
        if (!joinedAt) return '00:00'
        const joinedDate = new Date(joinedAt)
        const deadline = new Date(joinedDate.getTime() + paymentDeadlineHours * 60 * 60 * 1000)
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()
        
        if (diff <= 0) return '마감됨'
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}시간 ${minutes}분`
    }

    // Render Content based on Scenario
    const renderContent = () => {
        // Scenario A: Neither reserved nor joined
        if (status === 'none') {
            return (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CalendarCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">사전예약하고 혜택받으세요!</h3>
                    <div className="bg-[#2c2c2e] p-4 rounded-xl text-left space-y-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>가장 먼저 티오프 시간을 선점할 수 있습니다.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>매칭 우선권을 제공해 드립니다.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>취소 시 수수료가 면제됩니다 (예약 확정 전).</span>
                        </div>
                    </div>
                    <button 
                        onClick={closeModal}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                    >
                        사전예약 하러가기
                    </button>
                    <button onClick={closeModal} className="text-gray-500 text-xs hover:text-gray-300">
                        괜찮습니다, 그냥 볼게요
                    </button>
                </div>
            )
        }

        // Scenario B: Pre-reserved but not joined
        if (status === 'pre_reserved') {
            return (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Search className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">마음에 드는 조인방을 찾아보세요!</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        사전예약 회원님! <br/>
                        이제 개설된 조인방을 둘러보고,<br/>
                        <span className="text-white font-bold">마음에 드는 멤버가 있는 방</span>에 참여해보세요.
                    </p>
                    <button 
                        onClick={closeModal}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                    >
                        조인방 둘러보기
                    </button>
                </div>
            )
        }

        // Scenario C: Joined
        if (status === 'joined') {
            // C-1: Unpaid
            if (paymentStatus !== 'paid') {
                return (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            <span className="text-emerald-400">{roomNumber}번방</span>에 참여중입니다
                        </h3>
                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-1">
                            <div className="text-sm text-red-200">결제 마감까지 남은 시간</div>
                            <div className="text-2xl font-black text-red-500 font-mono tracking-wider">
                                {getRemainingTime()}
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs">
                            시간 내 결제하지 않으시면 자동으로 취소될 수 있습니다.
                        </p>
                        <button 
                            onClick={closeModal}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                        >
                            지금 결제하기
                        </button>
                    </div>
                )
            }

            // C-2: Paid
            return (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">완벽하게 부킹되었습니다!</h3>
                    <p className="text-gray-300 text-sm">
                        <span className="text-emerald-400">{roomNumber}번방</span> 예약이 확정되었습니다.
                    </p>
                    
                    <div className="bg-[#2c2c2e] p-4 rounded-xl text-left space-y-2 mt-2">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-gray-400 leading-relaxed">
                                <span className="text-red-400 font-bold block mb-1">취소/환불 규정 안내</span>
                                천재지변을 제외한 개인 사정으로 인한 취소 시, 
                                <span className="text-white"> 위약금이 발생할 수 있으며 이용 정지 패널티</span>가 부과될 수 있습니다. 신중하게 일정을 확인해주세요.
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={closeModal}
                        className="w-full py-3 bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white font-bold rounded-xl transition-colors"
                    >
                        확인했습니다
                    </button>
                </div>
            )
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={closeModal}
            />
            
            {/* Modal Content */}
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-white/10 animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)] p-6">
                <button 
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={20} />
                </button>
                
                {renderContent()}
            </div>
        </div>
    )
}
