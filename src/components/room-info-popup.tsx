'use client'

import { useState } from 'react'
import { Crown, Shield, Gift, Users, X, Star, CheckCircle } from 'lucide-react'

interface RoomInfoPopupProps {
    isOpen: boolean
    onClose: () => void
}

export default function RoomInfoPopup({ isOpen, onClose }: RoomInfoPopupProps) {
    const [currentSlide, setCurrentSlide] = useState(0)

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
        {
            icon: Gift,
            iconColor: 'text-emerald-400',
            bgGradient: 'from-emerald-500/20 to-teal-500/10',
            title: '첫 조인 포인트 시상! 🎉',
            subtitle: '빠른 참여에는 보상이 따릅니다',
            benefits: [
                { icon: Crown, text: '1번방 첫 조인: 10포인트 시상' },
                { icon: Star, text: '2번방 첫 조인: 5포인트 시상' },
                { icon: CheckCircle, text: '활발한 참여로 매너점수 UP' },
            ]
        }
    ]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1c1c1e] w-full max-w-[400px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">알아두세요</p>
                </div>

                {/* Slide Content */}
                <div className="px-6">
                    {slides.map((slide, idx) => (
                        <div
                            key={idx}
                            className={`transition-all duration-500 ${currentSlide === idx ? 'block' : 'hidden'}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.bgGradient} flex items-center justify-center mb-4 mx-auto`}>
                                <slide.icon size={32} className={slide.iconColor} />
                            </div>
                            <h2 className="text-xl font-black text-white text-center mb-2">{slide.title}</h2>
                            <p className="text-sm text-white/50 text-center mb-6">{slide.subtitle}</p>

                            <div className="space-y-3 mb-8">
                                {slide.benefits.map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                                        <benefit.icon size={18} className={slide.iconColor} />
                                        <span className="text-sm text-white/80 font-medium whitespace-nowrap">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mb-4">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'w-6 bg-white' : 'bg-white/20'}`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 space-y-3">
                    {currentSlide < slides.length - 1 ? (
                        <button
                            onClick={() => setCurrentSlide(prev => prev + 1)}
                            className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all"
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 rounded-2xl active:scale-[0.98] transition-all"
                        >
                            시작하기 🚀
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full text-white/30 font-medium py-2 text-sm"
                    >
                        건너뛰기
                    </button>
                </div>
            </div>
        </div>
    )
}
