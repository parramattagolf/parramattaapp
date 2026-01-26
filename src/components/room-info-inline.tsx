'use client'

import { Star, CheckCircle } from 'lucide-react'

export default function RoomInfoInline() {
    const slides = [
        {
            icon: Star,
            iconColor: 'text-blue-400',
            bgGradient: 'from-blue-500/20 to-purple-500/10',
            title: '사전예약의 혜택 🌟',
            subtitle: '미리 관심을 표시하면 좋은 점!',
            benefits: [
                { icon: CheckCircle, text: '조인 모집 시작 시 초대 우선권' },
                { icon: CheckCircle, text: '라운딩 일정 알림 수신' },
                { icon: CheckCircle, text: '조인 경쟁에서 유리한 위치 선점' },
            ]
        },
    ]

    return (
        <div className="mt-12 space-y-10 border-t border-white/5 pt-10">
            <div className="px-2">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-8 text-center">Room Information & Benefits</p>
                
                <div className="space-y-12">
                    {slides.map((slide, idx) => (
                        <div key={idx} className="relative">
                            <div className="flex flex-col items-center">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.bgGradient} flex items-center justify-center mb-4 shadow-xl border border-white/5`}>
                                    <slide.icon size={28} className={slide.iconColor} />
                                </div>
                                <h3 className="text-[17px] font-black text-white mb-1.5">{slide.title}</h3>
                                <p className="text-xs text-white/40 mb-6 font-medium">{slide.subtitle}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                                {slide.benefits.map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-3 bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/[0.05]">
                                        <div className={`${slide.iconColor} bg-white/5 p-2 rounded-lg`}>
                                            <benefit.icon size={16} />
                                        </div>
                                        <span className="text-[13px] text-white/70 font-bold tracking-tight whitespace-nowrap">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-center pb-8 opacity-20">
                <p className="text-[10px] text-white font-medium uppercase tracking-widest">Parramatta Golf Social Club</p>
            </div>
        </div>
    )
}
