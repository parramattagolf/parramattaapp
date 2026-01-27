'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FlagTriangleRight } from 'lucide-react'

interface Member {
    id: string;
    nickname: string;
    profile_img: string | null;
    gender: string | null;
    distance?: number;
    isParticipant: boolean;
    isPreBooked: boolean;
    percentile: number;
    manner_score: number | null;
    points: number | null;
    hasBusinessInfo: boolean;
    job: string | null;
    membership_level: string | null;
    pro?: boolean;
    golf_experience?: string | null;
}

export default function MembersListContainer({ members, sponsors }: { members: Member[], sponsors: any[] }) {
    const [sortBy, setSortBy] = useState<'manner' | 'points' | 'business'>('manner')
    const [visibleCount, setVisibleCount] = useState(10)

    // Reset visible count when sort changes
    const handleSortChange = (newSort: 'manner' | 'points' | 'business') => {
        setSortBy(newSort)
        setVisibleCount(10)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const filteredMembers = members.filter(member => {
        if (sortBy === 'business') {
            return member.hasBusinessInfo
        }
        if (sortBy === 'points') {
            return member.pro === true
        }
        return true
    })

    const sortedMembers = [...filteredMembers].sort((a, b) => {
        if (sortBy === 'manner') {
            return (b.manner_score || 0) - (a.manner_score || 0)
        } else if (sortBy === 'points') {
            return (b.points || 0) - (a.points || 0)
        } else if (sortBy === 'business') {
            // Sort business list by manner score as secondary sort
            return (b.manner_score || 0) - (a.manner_score || 0)
        }
        return 0
    })

    const visibleMembers = sortedMembers.slice(0, visibleCount)

    return (
        <>
            {/* Sort Tabs - Top Fixed (Below Header) */}
            <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5">
                <div className="flex">
                    <button 
                        onClick={() => handleSortChange('manner')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                            sortBy === 'manner' ? 'text-white' : 'text-white/40'
                        }`}
                    >
                        매너포인트
                        {sortBy === 'manner' && (
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                    <button 
                        onClick={() => handleSortChange('points')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                            sortBy === 'points' ? 'text-white' : 'text-white/40'
                        }`}
                    >
                        프로
                        {sortBy === 'points' && (
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                        )}
                    </button>
                    <button 
                        onClick={() => handleSortChange('business')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                            sortBy === 'business' ? 'text-white' : 'text-white/40'
                        }`}
                    >
                        비지니스
                        {sortBy === 'business' && (
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        )}
                    </button>
                </div>
            </div>

            <div className="pt-12 pb-24">
                {visibleMembers.map((member, index) => {
                    const elements = [];
                    
                    // Add Member Item
                    elements.push(
                        <MemberItem 
                            key={member.id} 
                            member={member} 
                            isParticipant={member.isParticipant} 
                            priority={index < 4}
                            sortBy={sortBy}
                        />
                    );

                    // Add Sponsor Ad Card
                    // Logic: Show every 5th member OR if total list is less than 5, show at the end
                    const showAd = ((index + 1) % 5 === 0) || (visibleMembers.length < 5 && index === visibleMembers.length - 1);

                    if (showAd && sponsors.length > 0) {
                        // Pseudo-random selection based on index to ensure stability (avoid hydration mismatch) but look random
                        // Using prime numbers for better distribution
                        const randomOffset = (index * 7 + 3); 
                        const sponsorIndex = randomOffset % sponsors.length;
                        const sponsor = sponsors[sponsorIndex];
                        
                        elements.push(
                            <SponsorAdCard key={`ad-${index}`} sponsor={sponsor} />
                        );
                    }

                    return elements;
                })}

                {visibleCount < sortedMembers.length && (
                    <div className="flex justify-center mt-8 mb-8">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="px-6 py-3 bg-[#1c1c1e] border border-white/5 rounded-full text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>더보기</span>
                            <span className="text-xs opacity-50">
                                ({visibleCount} / {sortedMembers.length})
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

function MemberItem({ member, isParticipant, priority = false, sortBy }: { member: Member, isParticipant: boolean, priority?: boolean, sortBy: 'manner' | 'points' | 'business' }) {
    return (
        <Link
            href={`/members/${member.id}`}
            className="flex items-center gap-4 py-4 px-gutter active:bg-[var(--color-surface-hover)] transition-colors relative"
        >

            <div className={`w-12 h-12 rounded-full bg-[var(--color-gray-100)] overflow-hidden shrink-0 transition-all box-border ${member.gender === 'male' ? 'border-4 border-blue-500 ring-2 ring-blue-500/20' :
                member.gender === 'female' ? 'border-4 border-red-500 ring-2 ring-red-500/20' :
                    'border border-[var(--color-divider)]'
                }`}>
                {member.profile_img ? (
                    <div className="relative w-full h-full">
                        <Image 
                            src={member.profile_img} 
                            alt={member.nickname} 
                            fill 
                            className="object-cover" 
                            unoptimized 
                            priority={priority}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {sortBy !== 'business' ? (
                        <div className="font-bold text-[var(--color-text-primary)] truncate">{member.nickname}</div>
                    ) : (
                        member.job && (
                            <div className="font-bold text-amber-500 truncate">{member.job}</div>
                        )
                    )}
                    
                    {/* Flags (Hidden in Business Tab) */}
                    {member.isPreBooked && sortBy !== 'business' && (
                        <FlagTriangleRight size={14} className="text-blue-500 fill-current animate-pulse ml-1" />
                    )}
                    {isParticipant && sortBy !== 'business' && (
                        <FlagTriangleRight size={14} className="text-green-500 fill-current animate-pulse ml-1" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {member.distance && (
                         <span className="text-[10px] font-black text-white/40 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                            🔗 {member.distance}촌
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-end min-w-[30px] justify-center">
                {sortBy === 'manner' && (member.manner_score || 0) > 0 && (
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-green-500 font-mono tracking-tighter shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                            {member.manner_score}
                        </span>
                        {(member.points || 0) > 0 && (
                            <span className="text-[10px] font-bold text-pink-500 mt-0.5">
                                {member.points?.toLocaleString()} P
                            </span>
                        )}
                    </div>
                )}
                {sortBy === 'points' && member.golf_experience && (
                    <span className="text-sm font-bold text-pink-500 font-mono tracking-tight">
                        {member.golf_experience}
                    </span>
                )}
                {/* Business Job Badge Removed (Moved to left as text) */}
            </div>
        </Link>
    )
}

function SponsorAdCard({ sponsor }: { sponsor: any }) {
    return (
        <div className="mx-gutter mt-2 mb-6 p-5 bg-gradient-to-br from-[#1c1c1e] to-[#121212] rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[60px] rounded-full -translate-y-16 translate-x-16 group-hover:bg-yellow-500/10 transition-all duration-700"></div>
            
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#121212] flex items-center justify-center p-3 border border-white/5 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {sponsor.logo_url ? (
                        <Image 
                            src={sponsor.logo_url} 
                            alt="" 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-contain" 
                            unoptimized
                        />
                    ) : (
                        <span className="text-2xl">🏆</span>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest leading-none">
                            AD
                        </span>
                        <h4 className="text-[15px] font-black text-white truncate">{sponsor.name}</h4>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">
                        {sponsor.description || `${sponsor.name} 브랜드 소식을 확인해보세요.`}
                    </p>
                </div>

                <Link 
                    href={`/sponsors/${sponsor.id}`}
                    className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white transition-all active:scale-90"
                >
                    <span className="text-[10px] font-black leading-none mb-0.5">VIEW</span>
                    <span className="text-[14px]">→</span>
                </Link>
            </div>
        </div>
    )
}
