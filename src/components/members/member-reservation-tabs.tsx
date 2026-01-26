'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ReservationEvent {
    id: string
    title: string
    start_date: string
    course_name: string
}

interface PreResData {
    id: string
    created_at: string
    event: ReservationEvent
}

interface FriendlyRoundData {
    id: string
    joined_at: string
    payment_status: string
    event: ReservationEvent
}

interface MemberReservationTabsProps {
    preReservations: PreResData[]
    friendlyRounds: FriendlyRoundData[]
}

export default function MemberReservationTabs({ preReservations, friendlyRounds }: MemberReservationTabsProps) {
    const [activeTab, setActiveTab] = useState<'pre' | 'confirmed'>('pre')

    const tabs = [
        { id: 'pre', label: '사전예약', count: preReservations.length },
        { id: 'confirmed', label: '예약확정', count: friendlyRounds.length }
    ]

    return (
        <div className="mt-10">
            {/* Tab Headers */}
            <div className="px-gutter flex border-b border-white/5 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'pre' | 'confirmed')}
                        className={`flex-1 pb-4 text-lg font-black transition-all relative flex items-center justify-center gap-2 ${
                            activeTab === tab.id 
                                ? 'text-white' 
                                : 'text-white/20 hover:text-white/40'
                        }`}
                    >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'
                        }`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="px-gutter">
                {activeTab === 'pre' ? (
                    <div className="space-y-3">
                        {preReservations.length > 0 ? (
                            preReservations.map((pre) => (
                                <Link 
                                    href={`/rounds/${pre.event.id}`}
                                    key={pre.id}
                                    className="block bg-white/5 py-2.5 px-4 rounded-2xl border border-white/5 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1.5 max-w-[75%]">
                                            <div className="text-xl font-black text-white truncate leading-tight">{pre.event.title}</div>
                                            <div className="text-[11px] text-white/40 font-bold flex items-center gap-1">
                                                <span className="opacity-70">예약:</span>
                                                {new Date(pre.created_at).toLocaleString('ko-KR', { 
                                                    month: 'numeric', 
                                                    day: 'numeric', 
                                                    hour: 'numeric', 
                                                    minute: '2-digit',
                                                    hour12: true 
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-white/40 font-black tracking-tighter pt-1 whitespace-nowrap">
                                            {new Date(pre.event.start_date).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric'
                                            }).replace(/\.$/, "")}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                                <span className="text-xs text-white/20">사전예약된 일정이 없습니다.</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {friendlyRounds.length > 0 ? (
                            friendlyRounds.map((round) => (
                                <Link 
                                    href={`/rounds/${round.event.id}`}
                                    key={round.id}
                                    className="block bg-white/5 py-2.5 px-4 rounded-2xl border border-white/5 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1.5 max-w-[75%]">
                                            <div className="text-xl font-black text-white truncate leading-tight">{round.event.title}</div>
                                            <div className="text-[11px] text-white/40 font-bold flex items-center gap-1">
                                                <span className="opacity-70">예약:</span>
                                                {new Date(round.joined_at).toLocaleString('ko-KR', { 
                                                    month: 'numeric', 
                                                    day: 'numeric', 
                                                    hour: 'numeric', 
                                                    minute: '2-digit',
                                                    hour12: true 
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-white/40 font-black tracking-tighter pt-1 whitespace-nowrap">
                                            {new Date(round.event.start_date).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric'
                                            }).replace(/\.$/, "")}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                                <span className="text-xs text-white/20">확정된 예약 일정이 없습니다.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
