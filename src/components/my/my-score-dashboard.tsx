'use client'

import { useState } from 'react'

interface MyScoreDashboardProps {
    mannerScore: number
    points: number
    mannerPercentile: number
    pointRank: number
}

export default function MyScoreDashboard({ mannerScore, points, mannerPercentile, pointRank }: MyScoreDashboardProps) {
    const [showSeedToast, setShowSeedToast] = useState(false)
    const [showMannerToast, setShowMannerToast] = useState(false)

    const handleSeedClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowSeedToast(true)
        setTimeout(() => setShowSeedToast(false), 4000)
    }

    const handleMannerClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowMannerToast(true)
        setTimeout(() => setShowMannerToast(false), 4000)
    }

    return (
        <div className="px-5 pb-8 grid grid-cols-2 gap-3">
            {/* Manner Score Card */}
            <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] text-[var(--color-text-desc)] font-bold">매너 점수</div>
                    <div className="relative">
                        <button
                            onClick={handleMannerClick}
                            className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 transition-colors active:scale-95"
                        >
                            상위 {mannerPercentile}%
                        </button>
                        {showMannerToast && (
                            <div className="absolute bottom-full right-0 mb-2 w-max max-w-[150px] bg-[#2c2c2e] border border-white/10 text-white text-[11px] font-bold py-2 px-3 rounded-lg shadow-2xl z-20 animate-fade-in text-center break-keep leading-snug">
                                상위5% 이내 모든 행사 참가 우선권
                                <div className="absolute top-full right-3 -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10"></div>
                                <div className="absolute top-full right-3 -mt-[2px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#2c2c2e]"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-2xl font-bold text-emerald-500">{mannerScore}</div>
                <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, mannerScore)}%` }}
                    />
                </div>
            </div>

            {/* Points Card (Formerly Best Dresser) */}
            <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] text-[var(--color-text-desc)] font-bold">누적 포인트</div>
                    <div className="relative">
                        <button
                            onClick={handleSeedClick}
                            className="text-[10px] text-pink-400 font-bold bg-pink-500/10 px-1.5 py-0.5 rounded hover:bg-pink-500/20 transition-colors active:scale-95"
                        >
                            시드권 순위 {pointRank}위
                        </button>

                        {/* Speech Bubble Popup */}
                        {showSeedToast && (
                            <div className="absolute bottom-full right-0 mb-2 w-max max-w-[150px] bg-[#2c2c2e] border border-white/10 text-white text-[11px] font-bold py-2 px-3 rounded-lg shadow-2xl z-20 animate-fade-in text-center break-keep leading-snug">
                                144위 이내 대회참가가능
                                {/* Triangle Arrow */}
                                <div className="absolute top-full right-3 -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10"></div>
                                <div className="absolute top-full right-3 -mt-[2px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#2c2c2e]"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-2xl font-bold text-pink-500">{points.toLocaleString()}</div>
                <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-pink-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (points / 1000) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
