'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MyWarningPopupProps {
    mannerScore: number
}

export default function MyWarningPopup({ mannerScore }: MyWarningPopupProps) {
    const [showWarning, setShowWarning] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (mannerScore < 0) {
            setShowWarning(true)
        }
    }, [mannerScore])

    if (!showWarning) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWarning(false)}></div>
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[24px] border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 animate-pulse">
                        <span className="text-3xl">🚨</span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">긴급 경고</h3>
                    <div className="text-red-500 font-bold text-lg mb-6">
                        현재 매너점수: {mannerScore}점
                    </div>
                    <div className="text-[14px] text-white/80 leading-relaxed font-medium mb-6 bg-red-500/5 p-4 rounded-xl border border-red-500/10 w-full break-keep">
                        <p className="mb-1">
                            매너점수가 <span className="text-red-500 font-black underline underline-offset-4 decoration-red-500/50">-50점 이하</span>가 되면
                        </p>
                        <p className="mb-1">
                            <span className="text-white font-bold">서비스 이용이 자동으로 제한</span>되며,
                        </p>
                        <p>
                            보유하신 <span className="text-white font-bold">매너점수와 포인트가 모두 소멸</span>됩니다.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWarning(false)}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
                    >
                        확인했습니다
                    </button>
                </div>
            </div>
        </div>
    )
}
