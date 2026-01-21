'use client'

import React, { useState } from 'react'
import RoundCalendarSpotlight from './round-calendar-spotlight'
import { X } from 'lucide-react'

interface RoundInfoCardProps {
    event: any;
    participants: any[];
}

export default function RoundInfoCard({ event, participants }: RoundInfoCardProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    return (
        <>
            <div className="card-flat bg-[#1c1c1e] rounded-[32px] p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden animate-fade-in group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <span className="text-8xl select-none">INFO</span>
                </div>

                <div className="space-y-4 relative z-10 mt-2">
                    {/* 1. Date (Clickable) */}
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="flex items-center gap-5 w-full text-left active:scale-[0.98] transition-all hover:bg-white/5 p-2 -ml-2 rounded-xl"
                    >
                        <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                            <span className="text-xl">📅</span>
                        </div>
                        <div>
                            <div className="text-[16px] font-black text-white/90 tracking-tight">
                                {new Date(event.start_date).toLocaleString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'long'
                                })}
                            </div>
                        </div>
                    </button>

                    {/* 2. Location */}
                    <div className="flex items-center gap-5 p-2 -ml-2">
                        <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                            <span className="text-xl">📍</span>
                        </div>
                        <div>
                            <div className="text-[16px] font-black text-white/90 tracking-tight">
                                {event.location}
                            </div>
                        </div>
                    </div>

                    {/* 3. Capacity */}
                    <div className="flex items-center gap-5 p-2 -ml-2">
                        <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                            <span className="text-xl">👥</span>
                        </div>
                        <div>
                            <div className="text-[16px] font-black text-white/90 tracking-tight">
                                <span className="text-blue-500">{participants?.length || 0}</span>
                                <span className="text-white/20 mx-2">/</span>
                                <span>{event.max_participants || 4} Members</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Host (Hidden if admin) */}
                    {!event.host?.is_admin && (
                        <div className="flex items-center gap-5 p-2 -ml-2">
                            <div className="w-12 h-12 rounded-[18px] bg-[#2c2c2e] flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                                <span className="text-xl">👑</span>
                            </div>
                            <div>
                                <div className="text-[16px] font-black text-white/90 tracking-tight">
                                    {event.host?.nickname} <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded ml-2 uppercase">Verified</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar Modal */}
            {isCalendarOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                        onClick={() => setIsCalendarOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-sm animate-scale-up">
                        <button
                            onClick={() => setIsCalendarOpen(false)}
                            className="absolute -top-12 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <RoundCalendarSpotlight date={new Date(event.start_date)} />
                    </div>
                </div>
            )}
        </>
    )
}
