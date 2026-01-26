'use client'

import { useState } from 'react'

interface JoinConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function JoinConfirmModal({ isOpen, onClose, onConfirm }: JoinConfirmModalProps) {
    const [isChecked, setIsChecked] = useState(false)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
                <div className="p-6 space-y-6">
                    <h3 className="text-lg font-black text-white text-center">조인방 참가 규정 동의</h3>

                    <div className="bg-white/5 rounded-2xl p-4 space-y-5">
                        <div className="space-y-2">
                            <p className="text-[13px] font-black text-white">
                                신청 후 노쇼 발생 시 매너 점수가 크게 차감될 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-white/30 group-hover:border-white/50'}`}>
                            {isChecked && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                        />
                        <span className="text-[13px] text-white/60 font-medium group-hover:text-white/80 transition-colors">
                            위 규정을 확인하였으며 동의합니다.
                        </span>
                    </label>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl bg-[#2c2c2e] text-white/60 font-bold text-[13px] hover:bg-[#3a3a3c] transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!isChecked}
                            className={`flex-1 py-3.5 rounded-2xl font-black text-[13px] text-white transition-all shadow-lg ${isChecked
                                ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-blue-900/20'
                                : 'bg-white/10 text-white/20 cursor-not-allowed'
                                }`}
                        >
                            신청하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
