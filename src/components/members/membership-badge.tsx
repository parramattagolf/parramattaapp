'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface MembershipBadgeProps {
    level: string
    className?: string
}

export default function MembershipBadge({ level, className }: MembershipBadgeProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Handle case-insensitive level check
    const normalizedLevel = level.toLowerCase()

    // Order: Highest to Lowest for the stack (Black is top)
    const levels = ['black', 'blue', 'white', 'yellow', 'red']
    
    const levelStyles: Record<string, { active: string; label: string }> = {
        'red': { active: 'bg-red-500 text-white', label: 'RED' },
        'yellow': { active: 'bg-yellow-500 text-black', label: 'YELLOW' },
        'white': { active: 'bg-white text-black', label: 'WHITE' },
        'blue': { active: 'bg-blue-500 text-white', label: 'BLUE' },
        'black': { active: 'bg-black text-white border border-white/30', label: 'BLACK' }
    }

    return (
        <>
            <div className={`flex flex-col gap-1 items-center ${className || ''}`}>
                {levels.map((l) => {
                    const isActive = normalizedLevel === l
                    const style = levelStyles[l]
                    
                    return (
                        <button 
                            key={l}
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsOpen(true)
                            }}
                            className={`
                                text-[9px] font-black w-14 py-1 rounded-full uppercase tracking-tighter transition-all duration-300 text-center
                                ${isActive 
                                    ? `${style.active} shadow-[0_0_10px_rgba(255,255,255,0.1)] scale-110 z-10` 
                                    : 'bg-white/5 text-white/20 hover:bg-white/10'
                                }
                            `}
                        >
                            {style.label}
                        </button>
                    )
                })}
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsOpen(false)
                        }}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-white/10 animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#2c2c2e]">
                            <h3 className="text-white font-bold text-lg">회원 등급 안내</h3>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsOpen(false)
                                }}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 bg-[#1c1c1e]">
                            <LevelItem 
                                current={normalizedLevel === 'red'} 
                                color="bg-red-500" 
                                name="RED" 
                                desc="신규 가입 회원입니다." 
                            />
                             <LevelItem 
                                current={normalizedLevel === 'yellow'} 
                                color="bg-yellow-500 text-black" 
                                name="YELLOW" 
                                desc="기본 활동을 시작한 멤버입니다." 
                            />
                             <LevelItem 
                                current={normalizedLevel === 'white'} 
                                color="bg-white text-black" 
                                name="WHITE" 
                                desc="활동 인증이 완료된 정회원입니다." 
                            />
                             <LevelItem 
                                current={normalizedLevel === 'blue'} 
                                color="bg-blue-500 text-white" 
                                name="BLUE" 
                                desc="신뢰할 수 있는 회원으로, 라운드(방)를 직접 개설할 수 있습니다." 
                            />
                             <LevelItem 
                                current={normalizedLevel === 'black'} 
                                color="bg-black border border-white/20 text-white" 
                                name="BLACK" 
                                desc="커뮤니티 운영진 및 VIP 회원입니다." 
                            />
                        </div>

                        {/* Footer */}
                         <div className="p-5 border-t border-white/5 bg-[#2c2c2e]/50 text-center">
                            <p className="text-xs text-white/30 leading-relaxed">
                                등급 상향은 커뮤니티 활동, 매너 점수, <br/>운영진 심사에 따라 결정됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function LevelItem({ color, name, desc, current }: { color: string, name: string, desc: string, current: boolean }) {
    return (
        <div className={`flex items-start gap-4 p-3 rounded-xl transition-all ${current ? 'bg-white/5 border border-amber-500/30 ring-1 ring-amber-500/20' : 'opacity-50 hover:opacity-80'}`}>
            <div className={`${color} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter w-12 text-center shrink-0 mt-0.5 shadow-sm`}>
                {name}
            </div>
            <div>
                <div className={`text-sm font-bold flex items-center ${current ? 'text-amber-500' : 'text-white'}`}>
                    {name} 등급 
                    {current && <span className="ml-2 text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded-md font-black">MY</span>}
                </div>
                <div className="text-xs text-white/60 mt-1 leading-relaxed font-normal">
                    {desc}
                </div>
            </div>
        </div>
    )
}
