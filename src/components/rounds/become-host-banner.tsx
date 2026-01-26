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
                <p className="text-[11px] text-white/50 mb-4 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    가장 먼저 입장하면 방장이 됩니다
                </p>

                <div className="w-full flex gap-2 max-w-sm mx-auto">
                    {benefits.map((benefit, idx) => (
                        <div 
                            key={idx} 
                            className="flex-1 flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5 hover:bg-white/[0.06] transition-all"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center shrink-0 border border-yellow-500/10">
                                <benefit.icon size={14} className="text-yellow-500" />
                            </div>
                            <span className="text-[12px] text-white/80 font-bold tracking-tight whitespace-nowrap">{benefit.text.split(' ')[0]} {benefit.text.split(' ')[1]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
