'use client'

import { Crown, Shield, Users } from 'lucide-react'

export default function BecomeHostBanner() {
    const benefits = [
        { icon: Shield, text: '빈 슬롯을 "홀드"하여 예약 가능' },
        { icon: Users, text: '원치 않는 참가자 강퇴 권한' },
    ]

    return (
        <div className="bg-[#1c1c1e] rounded-[24px] p-5 border border-yellow-500/20 shadow-xl relative overflow-hidden group">
            {/* Colorful Background Effects */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-yellow-500/10 rounded-full blur-[60px] group-hover:bg-yellow-500/15 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[16px] flex items-center justify-center mb-4 shadow-[0_5px_15px_rgba(245,158,11,0.3)] border border-white/10 active:scale-95 transition-transform">
                    <Crown size={24} className="text-white drop-shadow-md" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-1 tracking-tighter">
                    조인방 호스트가 되세요! <span className="inline-block animate-bounce ml-1">👑</span>
                </h3>
            </div>
        </div>
    )
}
