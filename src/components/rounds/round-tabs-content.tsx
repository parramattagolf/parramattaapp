'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import RoundInfoCard from '@/components/round-info-card'
import PreReservationList from '@/components/pre-reservation-list'
import RoundDetailContent from '@/components/round-detail-content'

import { RoundingEvent, RoundingParticipant, RoundingPreReservation, UserStatus } from '@/types/rounding'
import { User } from '@supabase/supabase-js'

interface RoundTabsContentProps {
    event: RoundingEvent;
    participants: RoundingParticipant[];
    preReservations: RoundingPreReservation[];
    userStatus: UserStatus;
    currentUser: User | null; 
    isJoined: boolean;
}

export default function RoundTabsContent({
    event,
    participants,
    preReservations,
    userStatus,
    currentUser,
    isJoined
}: RoundTabsContentProps) {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'brackets' ? 'brackets' : 'schedule'
    const [activeTab, setActiveTab] = useState<'schedule' | 'brackets'>(initialTab)

    // Sync tab with URL param if changes (optional, but good for direct links)
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'brackets' || tab === 'schedule') {
            setActiveTab(tab)
        }
    }, [searchParams])

    // Scroll to top when tab changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [activeTab]);

    return (
        <div className="space-y-0">
            {/* Fixed Tabs Header - Locked to PremiumSubHeader at top-0 + 64px height */}
            <div className="fixed top-[64px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[110] bg-[#121212]/95 backdrop-blur-xl border-b border-white/5 flex px-6">
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${activeTab === 'schedule' ? 'text-white' : 'text-white/30'}`}
                >
                    일정
                    {activeTab === 'schedule' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full"></div>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('brackets')}
                    className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${activeTab === 'brackets' ? 'text-white' : 'text-white/30'}`}
                >
                    조편성
                    {activeTab === 'brackets' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Spacer for Fixed TabsHeader (Header 64px + Tabs ~56px) */}
            <div className="h-[56px]"></div>

            <div className="px-6 pt-8 pb-32">
                {activeTab === 'schedule' ? (
                    <div className="animate-fade-in space-y-10">

                        {/* Event Details Card */}
                        <div className="animate-slide-up [animation-delay:100ms]">
                            <RoundInfoCard event={event} participants={participants || []} />
                        </div>

                        {/* Title and Description */}
                        <div className="animate-slide-up [animation-delay:200ms] space-y-4">
                            <h2 className="text-xl font-black text-white tracking-tighter">라운드 소개</h2>
                            <div className="bg-[#1c1c1e] rounded-[32px] p-6 border border-white/5 shadow-xl">
                                <p className="text-white/60 text-[14px] font-medium leading-relaxed whitespace-pre-wrap">
                                    {event.description || '상세 설명이 없습니다.'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-10">

                        {/* Participants and Rooms */}
                        <div className="space-y-12">
                            <div className="animate-slide-up [animation-delay:100ms]">
                                <PreReservationList 
                                    reservations={preReservations || []} 
                                    eventId={event.id}
                                    isPreReserved={userStatus === 'pre_reserved'}
                                    userStatus={userStatus}
                                />
                            </div>

                            <div className="animate-slide-up [animation-delay:200ms]">
                                <RoundDetailContent
                                    event={event}
                                    participants={participants || []}
                                    currentUser={currentUser}
                                    isHost={!!(currentUser && event.host_id === currentUser.id)}
                                    isJoined={isJoined}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
