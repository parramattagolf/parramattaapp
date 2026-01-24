'use client'

import { Crown, Shield, Users } from 'lucide-react'

export default function BecomeHostBanner() {
    const benefits = [
        { icon: Shield, text: '빈 슬롯을 "홀드"하여 예약 가능' },
        { icon: Users, text: '원치 않는 참가자 강퇴 권한' },
    ]

    return (
        <div className="bg-[#1c1c1e] rounded-[32px] p-8 border border-yellow-500/20 shadow-2xl relative overflow-hidden group">
            {/* Colorful Background Effects */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] group-hover:bg-yellow-500/15 transition-all duration-700"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] group-hover:bg-orange-500/15 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[22px] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(245,158,11,0.3)] border border-white/10 active:scale-95 transition-transform">
                    <Crown size={32} className="text-white drop-shadow-md" />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter drop-shadow-sm">
                    조인방 호스트가 되세요! <span className="inline-block animate-bounce ml-1">👑</span>
                </h3>
                <p className="text-[13px] text-white/50 mb-8 font-bold uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                    가장 먼저 입장하면 호스트가 됩니다
                </p>

                <div className="w-full space-y-3 max-w-sm mx-auto">
                    {benefits.map((benefit, idx) => (
                        <div 
                            key={idx} 
                            className="flex items-center gap-4 bg-white/[0.03] rounded-2xl px-6 py-5 border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group/item"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center shrink-0 border border-yellow-500/10 group-hover/item:scale-110 transition-transform">
                                <benefit.icon size={20} className="text-yellow-500" />
                            </div>
                            <span className="text-[15px] text-white/80 font-black tracking-tight whitespace-nowrap">{benefit.text}</span>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    )
}
