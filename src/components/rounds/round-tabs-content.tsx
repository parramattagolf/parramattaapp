'use client'

import { useState } from 'react'
import RoundInfoCard from '@/components/round-info-card'
import PreReservationList from '@/components/pre-reservation-list'
import RoundDetailContent from '@/components/round-detail-content'
import PreReservationBanner from '@/components/rounds/pre-reservation-banner'
import HostBenefitsBanner from '@/components/rounds/host-benefits-banner'

interface RoundTabsContentProps {
    event: any;
    participants: any[];
    preReservations: any[];
    userStatus: 'none' | 'pre_reserved' | 'joined';
    invitation: any;
    currentUser: any;
    isJoined: boolean;
    isPreReserved: boolean;
    preReservedNickname?: string;
}

export default function RoundTabsContent({
    event,
    participants,
    preReservations,
    userStatus,
    invitation,
    currentUser,
    isJoined,
    preReservedNickname
}: RoundTabsContentProps) {
    const [activeTab, setActiveTab] = useState<'schedule' | 'brackets'>('schedule')

    return (
        <div className="space-y-0">
            {/* Sticky Tabs Header - Adjusted for PremiumSubHeader compatibility */}
            <div className="sticky top-[64px] z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-white/5 flex px-6">
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${activeTab === 'schedule' ? 'text-white' : 'text-white/30'}`}
                >
                    일정
                    {activeTab === 'schedule' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('brackets')}
                    className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${activeTab === 'brackets' ? 'text-white' : 'text-white/30'}`}
                >
                    조편성
                    {activeTab === 'brackets' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>
                    )}
                </button>
            </div>

            <div className="px-6 pt-8 pb-32">
                {activeTab === 'schedule' ? (
                    <div className="animate-fade-in space-y-10">
                        {/* 1. Pre-reservation Banner in Schedule Tab */}
                        {userStatus === 'none' && (
                            <div className="animate-slide-up">
                                <PreReservationBanner eventId={event.id} />
                            </div>
                        )}

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
                                <PreReservationList reservations={preReservations || []} />
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
