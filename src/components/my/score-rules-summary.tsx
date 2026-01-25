'use client'

import { PlusCircle, MinusCircle, Info } from 'lucide-react'

export default function ScoreRulesSummary() {
    const earnRules = [
        { title: '프로필 필수정보 완성', score: '+100', points: '+100', desc: '실명, 성별, 연령, 지역 등 입력 시' },
        { title: '유튜브 채널 구독', score: '-', points: '+100', desc: '파라마타 골프 TV 구독 시 (1회)' },
        { title: '사전예약 보너스', score: '-', points: '+1', desc: '조인방 개설 전 사전예약 참여 시' },
        { title: '스폰서 배지 획득', score: '변동', points: '변동', desc: '특정 이벤트 및 미션 달성 시' },
    ]

    const lossRules = [
        { title: '사전예약 취소', score: '-2', points: '-', desc: '사전예약 확정 후 본인 취소 시' },
        { title: '3시간 내 중도 퇴장', score: '-20', points: '-20', desc: '조인 신청 후 3시간 이내 방 나가기' },
        { title: '결제 시간 초과 (노쇼)', score: '-30', points: '-30', desc: '3시간 내 미결제로 자동 강퇴 시' },
    ]

    return (
        <div className="px-gutter mt-16 pb-20">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
                    매너점수 포인트 정책 가이드
                    <Info size={14} className="text-white/20" />
                </h3>
            </div>

            <div className="space-y-6">
                {/* Earning Rules */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform duration-700">
                        <PlusCircle size={80} />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <PlusCircle size={18} className="text-emerald-500" />
                        <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">EARN (적립)</span>
                    </div>
                    <div className="space-y-4">
                        {earnRules.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="text-[15px] font-bold text-white/90">{rule.title}</div>
                                    <div className="text-[13px] text-white/30 mt-0.5">{rule.desc}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[13px] font-black text-emerald-400">P {rule.points}</div>
                                    <div className="text-[13px] font-black text-emerald-400/60">M {rule.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deduction Rules */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500 group-hover:scale-110 transition-transform duration-700">
                        <MinusCircle size={80} />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <MinusCircle size={18} className="text-red-500" />
                        <span className="text-sm font-black text-red-500 uppercase tracking-widest">LOSS (차감)</span>
                    </div>
                    <div className="space-y-4">
                        {lossRules.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="text-[15px] font-bold text-white/90">{rule.title}</div>
                                    <div className="text-[13px] text-white/30 mt-0.5">{rule.desc}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[13px] font-black text-red-400">P {rule.points}</div>
                                    <div className="text-[13px] font-black text-red-400/60">M {rule.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notice Footer */}
                <div className="bg-white/5 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                        매너점수가 <span className="text-red-400 font-bold">-50점 이하</span>가 될 경우 서비스 이용이 자동으로 제한됩니다. 커뮤니티의 건강한 라운딩 문화를 위해 협조 부탁드립니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
