'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isWithinInterval, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, List } from 'lucide-react'

import { fetchYoutubePlaylist } from '@/actions/youtube-actions'

// Shared logic for day color
const getDayColor = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = date.getDay() // 0: Sun, 6: Sat
    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

    // Simple fixed holidays (Solar)
    const holidays = [
        '01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'
    ]

    // 2026/2025 Specific Major Lunar Holidays (Seollal, Chuseok, Buddha)
    const variableHolidays = [
        '2025-01-28', '2025-01-29', '2025-01-30', '2025-05-05', '2025-10-05', '2025-10-06', '2025-10-07',
        '2026-02-16', '2026-02-17', '2026-02-18', '2026-05-24', '2026-09-24', '2026-09-25', '2026-09-26'
    ]

    const fullDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

    if (dayOfWeek === 0 || holidays.includes(dateStr) || variableHolidays.includes(fullDateStr)) return 'text-red-500'
    if (dayOfWeek === 6) return 'text-blue-400'
    return 'text-white'
}

interface Event {
    id: string;
    start_date: string;
    end_date?: string;
    title: string;
    max_participants?: number;
    current_participants?: number;
    description?: string;
    participant_count?: number;
    pre_reservation_count?: number;
    sponsor?: {
        name: string;
        logo_url: string;
    }
}

interface MonthSectionProps {
    month: string
    events: Event[]
    view?: string
}

export default function MonthSection({ month, events, view }: MonthSectionProps) {
    const [mode, setMode] = useState<'list' | 'calendar'>('list')
    const [randomVideoId, setRandomVideoId] = useState<string | null>(null)

    useEffect(() => {
        const fetchRandomVideo = async () => {
            try {
                const playlistId = 'PLpf6bXUHPOxCLpBujRRqy01DfgCrYlThp'
                const data = await fetchYoutubePlaylist(playlistId)
                
                if (data && data.items && data.items.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.items.length)
                    const videoId = data.items[randomIndex].snippet.resourceId.videoId
                    setRandomVideoId(videoId)
                }
            } catch (error) {
                console.error('Failed to fetch YouTube playlist:', error)
            }
        }

        fetchRandomVideo()
    }, [])

    // Parse month string "yyyy년 M월" to Date
    const [yearStr, monthStr] = month.replace('년', '').replace('월', '').split(' ')
    const monthDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)

    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startPadding = getDay(monthStart)
    const paddingDays = Array.from({ length: startPadding })

    return (
        <section>
            <div className="px-6 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`h-[3px] w-5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)] ${view === 'past' ? 'bg-white/20' : 'bg-yellow-500'}`}></span>
                    <h2 className={`text-sm font-bold tracking-normal uppercase ${view === 'past' ? 'text-white/30' : 'text-white/60'}`}>{month}</h2>
                </div>
                <button
                    onClick={() => setMode(mode === 'list' ? 'calendar' : 'list')}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                >
                    {mode === 'list' ? <Calendar size={14} strokeWidth={2.5} /> : <List size={14} strokeWidth={2.5} />}
                </button>
            </div>

            {mode === 'list' ? (
                <div className="space-y-4 px-4">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/rounds/${event.id}`}
                            className={`block transition-all duration-150 active:scale-[0.96] ${view === 'past' ? 'opacity-60 grayscale' : ''}`}
                        >
                            {(() => {
                                const hasParticipants = (event.participant_count ?? 0) > 0
                                const hasPreReservations = (event.pre_reservation_count ?? 0) > 0
                                
                                let borderClass = 'border-white/10'
                                
                                if (view !== 'past') {
                                    if (hasParticipants) {
                                        borderClass = 'border-emerald-500'
                                    } else if (hasPreReservations) {
                                        borderClass = 'border-blue-500'
                                    }
                                }
                                
                                return (
                            <div className={`transition-all duration-300 rounded-[24px] py-4 px-6 shadow-xl relative overflow-hidden group/card ${view === 'past' ? 'bg-[#18181a] border border-white/5 opacity-60' : `bg-[#1c1c1e] border ${borderClass} hover:bg-[#252527]`}`}>

                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border border-white/5 shadow-inner p-2 ${view === 'past' ? 'bg-[#252527]' : 'bg-[#2c2c2e]'}`}>
                                            <span className={`text-[13px] font-black uppercase leading-none mb-1 ${view === 'past' ? 'text-white/30' : getDayColor(new Date(event.start_date))}`}>
                                                {format(new Date(event.start_date), 'EEE', { locale: ko })}
                                            </span>
                                            <span className="text-xl font-black text-white leading-none tracking-tighter">
                                                {format(new Date(event.start_date), 'd')}
                                            </span>
                                        </div>
                                        {view !== 'past' && (() => {
                                            const start = new Date(event.start_date)
                                            const end = event.end_date ? new Date(event.end_date) : start
                                            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                                            const label = diff <= 0 ? '당일' : `${diff}박 ${diff + 1}일`
                                            const colorClass = diff <= 0 
                                                ? 'text-blue-400 bg-blue-400/10' 
                                                : 'text-purple-400 bg-purple-400/10'
                                            
                                            const isFull = event.max_participants && (event.participant_count || 0) >= event.max_participants

                                            return (
                                                <div className="flex flex-col gap-1 mt-0.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md text-center ${colorClass}`}>
                                                        {label}
                                                    </span>
                                                    {isFull && (
                                                        <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-md text-center shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse">
                                                            마감
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {event.sponsor && !view && (
                                                    <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                                        Premium
                                                    </span>
                                                )}

                                            </div>
                                        </div>

                                        <h3 className={`text-[15px] font-black leading-snug mb-1 tracking-tighter break-keep ${view === 'past' ? 'text-white/40' : 'text-white'}`}>
                                            {event.title}
                                        </h3>
                                        {event.description && (
                                            <p className={`text-[11px] leading-snug truncate mb-2 tracking-tighter ${view === 'past' ? 'text-white/20' : 'text-white/40'}`}>
                                                {event.description}
                                            </p>
                                        )}

                                        {/* Recruitment Percentage */}
                                        {event.max_participants && event.max_participants > 0 && view !== 'past' && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">참가현황</span>
                                                    <span className={`text-[11px] font-black ${
                                                        (event.participant_count || 0) >= event.max_participants ? 'text-emerald-400' : 'text-blue-400'
                                                    }`}>
                                                        {Math.round(((event.participant_count || 0) / event.max_participants) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            (event.participant_count || 0) >= event.max_participants ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Math.round(((event.participant_count || 0) / event.max_participants) * 100))}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-[9px] font-bold text-white/20">
                                                        {event.participant_count || 0} / {event.max_participants} 명
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )
                            })()}
                        </Link>
                    ))}
                    <div className="mt-6 rounded-[24px] overflow-hidden border border-white/10 shadow-xl bg-[#1c1c1e]">
                        <div className="aspect-video w-full">
                            {randomVideoId ? (
                                <iframe 
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${randomVideoId}?rel=0`}
                                    title="YouTube video player" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#2c2c2e]">
                                    <div className="text-white/40 text-sm">영상 로딩 중...</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-6 animate-fade-in">
                    <div className="bg-[#1c1c1e] rounded-[32px] p-6 border border-white/10 shadow-xl">
                        <div className="grid grid-cols-7 gap-y-4 text-center mb-2">
                            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                                <div key={day} className={`text-[12px] font-bold uppercase ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-400' : 'text-white/30'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="w-full h-[1px] bg-white/5 mb-6"></div>
                        <div className="grid grid-cols-7 gap-y-6 text-center">
                            {paddingDays.map((_, i) => <div key={`padding-${i}`} />)}
                            {days.map((day) => {
                                const dayColor = getDayColor(day)
                                const isToday = isSameDay(day, new Date())

                                // Find relevant events that intersect with this day
                                const dayStr = format(day, 'yyyy-MM-dd')
                                
                                const dayEvents = events.filter(e => {
                                    const eventStartStr = format(new Date(e.start_date), 'yyyy-MM-dd')
                                    let eventEndStr = e.end_date ? format(new Date(e.end_date), 'yyyy-MM-dd') : eventStartStr
                                    
                                    // Handle invalid data where end_date < start_date
                                    if (eventEndStr < eventStartStr) {
                                        eventEndStr = eventStartStr
                                    }
                                    
                                    return dayStr >= eventStartStr && dayStr <= eventEndStr
                                })

                                // Calculate the visual indicator for each event
                                const indicators = dayEvents.map(e => {
                                    const eventStartStr = format(new Date(e.start_date), 'yyyy-MM-dd')
                                    let eventEndStr = e.end_date ? format(new Date(e.end_date), 'yyyy-MM-dd') : eventStartStr
                                    
                                    // Handle invalid data where end_date < start_date
                                    if (eventEndStr < eventStartStr) {
                                        eventEndStr = eventStartStr
                                    }
                                    
                                    const isSingleDay = eventStartStr === eventEndStr
                                    const isStartNode = dayStr === eventStartStr
                                    const isEndNode = dayStr === eventEndStr

                                    return {
                                        id: e.id,
                                        isSingleDay,
                                        isStartNode,
                                        isEndNode
                                    }
                                })

                                return (
                                    <div key={day.toString()} className="flex flex-col items-center gap-1 min-h-[44px] relative">
                                        <span className={`text-[14px] font-bold z-10 ${dayColor} ${isToday ? 'bg-white/10 w-7 h-7 flex items-center justify-center rounded-full -my-1' : ''}`}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Event Indicators Stacking Context */}
                                        <div className="w-full flex flex-col items-center gap-1 mt-1">
                                            {indicators.map((ind) => (
                                                <Link
                                                    key={ind.id}
                                                    href={`/rounds/${ind.id}`}
                                                    className="w-full h-1.5 flex items-center justify-center relative active:opacity-70"
                                                >
                                                    {ind.isSingleDay ? (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                                                    ) : (
                                                        <div className={`h-1.5 bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)] 
                                                            ${ind.isStartNode ? 'w-1/2 ml-auto rounded-l-full' : ''}
                                                            ${ind.isEndNode ? 'w-1/2 mr-auto rounded-r-full' : ''}
                                                            ${!ind.isStartNode && !ind.isEndNode ? 'w-full' : ''}
                                                        `}></div>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
