'use client'

import React from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RoundCalendarSpotlightProps {
    date: Date;
}

export default function RoundCalendarSpotlight({ date }: RoundCalendarSpotlightProps) {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Padding for the start of the week (Sunday = 0 in JS Date)
    const startPadding = getDay(monthStart)
    const paddingDays = Array.from({ length: startPadding })

    return (
        <div className="card-flat bg-[#1c1c1e] rounded-[32px] p-8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <span className="text-8xl select-none font-black italic">DATE</span>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <h2 className="text-[16px] font-black text-white tracking-[0.2em] uppercase opacity-80">Round Spotlight</h2>
                    <span className="text-[12px] font-bold text-blue-500 mt-1 uppercase tracking-wider">
                        {format(date, 'MMMM yyyy', { locale: ko })}
                    </span>
                </div>
                <div className="w-10 h-[2px] bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 text-center">
                {/* Day Headers */}
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        {day}
                    </div>
                ))}

                {/* Padding Days */}
                {paddingDays.map((_, i) => (
                    <div key={`padding-${i}`} />
                ))}

                {/* Calendar Days */}
                {days.map((day) => {
                    const isTarget = isSameDay(day, date)
                    return (
                        <div key={day.toString()} className="relative flex items-center justify-center p-2">
                            {isTarget && (
                                <div className="absolute inset-0 z-0 flex items-center justify-center">
                                    <div className="w-10 h-10 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse-gentle"></div>
                                </div>
                            )}
                            <span className={`relative z-10 text-[14px] font-bold ${isTarget ? 'text-white' : 'text-white/40'
                                }`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[12px] font-bold text-white/60">
                    {format(date, 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 정기 라운딩
                </span>
            </div>
        </div>
    )
}
