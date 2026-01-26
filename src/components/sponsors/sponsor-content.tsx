'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SponsorVideoList from '@/components/sponsors/sponsor-video-list'

interface Sponsor {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
}

interface SponsorContentProps {
    prioritySponsors: Sponsor[];
    regularSponsors: Sponsor[];
}

export default function SponsorContent({ prioritySponsors, regularSponsors }: SponsorContentProps) {
    const searchParams = useSearchParams()
    
    // Initialize state from URL param if present
    const initialTab = searchParams.get('tab') === 'tournaments' ? 'tournaments' : 'sponsors'
    const [activeTab, setActiveTab] = useState<'sponsors' | 'tournaments'>(initialTab)
    const [tournamentSubTab, setTournamentSubTab] = useState<'schedule' | 'groups'>('schedule')

    // Handle URL changes (e.g. from the top nav link)
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'tournaments') {
            setActiveTab('tournaments')
        } else if (tab === 'sponsors') {
            setActiveTab('sponsors')
        }
    }, [searchParams])

    return (
        <div className="flex flex-col min-h-screen">

            <div className="flex-1">
                {activeTab === 'sponsors' ? (
                    <div className="animate-fade-in animate-slide-up pt-10">
                        {/* Priority Section (Active Sponsors) */}
                        {prioritySponsors.length > 0 && (
                            <div className="mt-4">
                                <div className="divide-y divide-[var(--color-divider)]">
                                    {prioritySponsors.map((sponsor) => (
                                        <SponsorItem key={sponsor.id} sponsor={sponsor} isActive={true} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular Section */}
                        <div className="divide-y divide-[var(--color-divider)]">
                            {regularSponsors.map((sponsor) => (
                                <SponsorItem key={sponsor.id} sponsor={sponsor} isActive={false} />
                            ))}
                        </div>
                        
                        {/* Sponsor Playlist Video */}
                        <div className="px-gutter mt-8">
                            <SponsorVideoList />
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in animate-slide-up">
                        {/* Tournament Sub-Tabs (Schedule vs Groups) - Match Round Detail Style */}
                        <div className="fixed top-[56px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[80] bg-[#121212]/90 backdrop-blur-xl border-b border-white/5 flex">
                            <button
                                onClick={() => setTournamentSubTab('schedule')}
                                className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${
                                    tournamentSubTab === 'schedule' ? 'text-white' : 'text-white/30'
                                }`}
                            >
                                일정
                                {tournamentSubTab === 'schedule' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500 rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setTournamentSubTab('groups')}
                                className={`flex-1 py-4 text-[16px] font-black tracking-tight transition-all relative ${
                                    tournamentSubTab === 'groups' ? 'text-white' : 'text-white/30'
                                }`}
                            >
                                조편성
                                {tournamentSubTab === 'groups' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500 rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                                )}
                            </button>
                        </div>
                        
                        {/* Spacer for fixed tabs */}
                        <div className="h-[56px]"></div>

                        <div className="px-6 pt-10 pb-32">
                            {tournamentSubTab === 'schedule' ? (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="bg-[#1c1c1e] rounded-[32px] border border-white/5 p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
                                        <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center text-4xl mb-2 border border-yellow-500/10">
                                            📅
                                        </div>
                                        <h3 className="text-xl font-black text-white">대회 일정을 준비 중입니다</h3>
                                        <p className="text-sm text-white/40 leading-relaxed max-w-[240px]">
                                            곧 화려한 골프 대회 일정이 <br />이곳에 업데이트 될 예정입니다.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="bg-[#1c1c1e] rounded-[32px] border border-white/5 p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-4xl mb-2 border border-emerald-500/10">
                                            🤝
                                        </div>
                                        <h3 className="text-xl font-black text-white">조편성을 준비 중입니다</h3>
                                        <p className="text-sm text-white/40 leading-relaxed max-w-[240px]">
                                            심장을 뛰게 할 최강의 라인업을 <br />준비하고 있습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SponsorItem({ sponsor, isActive }: { sponsor: Sponsor, isActive: boolean }) {
    return (
        <Link
            href={`/sponsors/${sponsor.id}`}
            className="flex items-center gap-4 py-4 px-gutter active:bg-[var(--color-surface-hover)] transition-colors"
        >
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-gray-100)] overflow-hidden border border-[var(--color-divider)] shrink-0 flex items-center justify-center">
                {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt="" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🏆</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-[var(--color-text-primary)]">{sponsor.name}</div>
                    {isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-500 text-white rounded uppercase tracking-widest shadow-[0_2px_8px_rgba(37,99,235,0.3)]">Active</span>
                    )}
                </div>
                <div className="text-xs text-[var(--color-text-desc)] truncate mt-0.5">
                    {sponsor.description || '브랜드 정보가 없습니다.'}
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.15)]">
                    Official
                </div>
            </div>
        </Link>
    )
}
