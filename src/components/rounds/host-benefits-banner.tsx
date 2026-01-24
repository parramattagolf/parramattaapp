'use client'

import { Search, MailOpen } from 'lucide-react'
import Link from 'next/link'

interface HostBenefitsBannerProps {
    eventId?: string;
    invitation?: {
        group_no: number;
    } | null;
    nickname?: string;
}

export default function HostBenefitsBanner({ eventId, invitation, nickname }: HostBenefitsBannerProps) {
    if (invitation && eventId) {
        return (
            <div className="bg-[#1c1c1e] rounded-[32px] p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden group animate-bounce-subtle">
                {/* Background Glow */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-[22px] flex items-center justify-center mb-6 shadow-xl border border-blue-500/10 scale-110 active:scale-100 transition-transform">
                        <MailOpen size={32} className="text-blue-500" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tighter">
                        초대받으셨습니다! ✉️
                    </h3>
                    
                    <div className="space-y-1 mb-8">
                        <p className="text-[15px] text-white/70 font-bold">{nickname || '회원'}님을 위한 자리가 기다리고 있어요!</p>
                        <p className="text-[13px] text-white/40 font-medium leading-relaxed">
                            <span className="text-blue-400 font-black">{invitation.group_no}번방</span>에서 회원님을 초대했습니다.<br/>
                            지금 바로 입장해서 조인을 확정하세요.
                        </p>
                    </div>

                    <Link 
                        href={`/rounds/${eventId}/rooms/${invitation.group_no}`}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 text-[15px] block"
                    >
                         조인방 입장하기 🚀
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#1c1c1e] rounded-[32px] p-8 border border-purple-500/20 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-[22px] flex items-center justify-center mb-6 shadow-xl border border-purple-500/10 animate-pulse">
                    <Search size={32} className="text-purple-500" />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-3 tracking-tighter">
                    마음에 드는 조인방을 찾아보세요! 🔍
                </h3>
                
                <div className="space-y-1 mb-8">
                    <p className="text-[15px] text-white/70 font-bold">{nickname || '회원'}님!</p>
                    <p className="text-[13px] text-white/40 font-medium leading-relaxed">
                        <span className="text-white">마음에 드는 멤버가 있는 방</span>에 참여해보세요.
                    </p>
                </div>

                <button 
                    onClick={() => {
                        const target = document.querySelector('.grid.grid-cols-4');
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20 text-[15px]"
                >
                     조인방 둘러보기 ✨
                </button>
            </div>
        </div>
    )
}

