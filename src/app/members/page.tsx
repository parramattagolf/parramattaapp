import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Heart, Flag } from 'lucide-react'
import PremiumSubHeader from '@/components/premium-sub-header'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-5">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
                    <Link href="/login" className="text-blue-500 font-bold">로그인하기</Link>
                </div>
            </div>
        )
    }

    // 1. Fetch participants (members who applied for rounds)
    // We get unique user_ids from participants table
    const { data: participantsData } = await supabase
        .from('participants')
        .select('user_id')

    const participantIds = [...new Set(participantsData?.map(p => p.user_id) || [])]

    // 2. Fetch all members
    const { data: members, error } = await supabase
        .from('users')
        .select('*')

    if (error) console.error('Error fetching members:', error)

    const allMembers = members || []

    // 3. Separate into participants and non-participants
    const roundParticipants = allMembers.filter(m => participantIds.includes(m.id))
    const others = allMembers.filter(m => !participantIds.includes(m.id))

    // 4. Combine and Sort
    const combinedMembers = [
        ...roundParticipants.map(m => ({ ...m, isParticipant: true })),
        ...others.map(m => ({ ...m, isParticipant: false }))
    ]

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans pt-24">
            <PremiumSubHeader 
                title={<span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>인맥</span>} 
                rightElement={<Link href="/members/search" className="text-blue-500 font-bold text-sm">인맥찾기</Link>}
            />

            <div className="divide-y divide-[var(--color-divider)]">
                {combinedMembers.map((member: any, index: number) => {
                    const videoIndex = (index + 1) / 5;
                    const randomOffset = Math.floor((index * 7 + 3) % 20); // Deterministic "random" for SSR
                    
                    return (
                        <div key={member.id}>
                            <MemberItem member={member} isParticipant={member.isParticipant} />
                            {(index + 1) % 5 === 0 && (
                                <div className="px-gutter py-8 bg-black/20">
                                    <div className="rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative aspect-video group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            src={`https://www.youtube.com/embed/videoseries?si=tNkcTeHAjB8inmNC&list=PLpf6bXUHPOxAL93x95ugCLwzXqQlpgRpd&index=${randomOffset}`}
                                            title="YouTube video player" 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            referrerPolicy="strict-origin-when-cross-origin" 
                                            allowFullScreen
                                            className="grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700"
                                        ></iframe>
                                        <div className="absolute top-5 left-5 pointer-events-none">
                                            <div className="bg-[#1c1c1e]/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2.5 shadow-2xl">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] text-white font-black tracking-[0.1em] uppercase">Recommended Contents</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

function MemberItem({ member, isParticipant }: { member: any, isParticipant: boolean }) {
    return (
        <Link
            href={`/members/${member.id}`}
            className="flex items-center gap-4 py-4 px-gutter active:bg-[var(--color-surface-hover)] transition-colors"
        >
            <div className={`w-12 h-12 rounded-full bg-[var(--color-gray-100)] overflow-hidden shrink-0 transition-all box-border ${member.gender === 'male' ? 'border-4 border-blue-500 ring-2 ring-blue-500/20' :
                member.gender === 'female' ? 'border-4 border-red-500 ring-2 ring-red-500/20' :
                    'border border-[var(--color-divider)]'
                }`}>
                {member.profile_img ? (
                    <img src={member.profile_img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-[var(--color-text-primary)]">{member.nickname}</div>
                    {isParticipant && (
                        <Flag size={12} className="text-red-500 fill-current" />
                    )}
                </div>
                {isParticipant && (
                    <div className="text-xs text-red-500 font-bold mt-0.5">라운딩참가중</div>
                )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <div className={`flex items-center gap-1 ${member.gender === 'male' ? 'text-blue-500' :
                    member.gender === 'female' ? 'text-pink-500' :
                        'text-gray-400'
                    }`}>
                    <Heart size={14} className="fill-current" />
                    <span className="text-sm font-black">{member.manner_score}</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-desc)]">
                    {member.job || '직업 미입력'} | {member.mbti || 'MBTI 미입력'}
                </div>
            </div>
        </Link>
    )
}
