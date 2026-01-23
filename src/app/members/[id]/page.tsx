/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import PremiumSubHeader from '@/components/premium-sub-header'
import ConnectionRequestButton from '@/components/members/connection-request-button'
import MembershipBadge from '@/components/members/membership-badge'
import MannerHistoryGraph from '@/components/manner-history-graph'

interface EnrichedProfile {
    id: string;
    distance: number;
}

interface RecentRound {
    id: string;
    joined_at: string;
    event: {
        id: string;
        title: string;
        start_date: string;
        course_name: string;
    };
}

interface Badge {
    id: string;
    sponsor_id: string;
    sponsor: {
        name: string;
        logo_url: string;
    } | null;
    product: {
        name: string;
    } | null;
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // 1. Get primary profile info
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) notFound()

    // 2. Get distance info separately (optional enrichment)
    const { data: distData } = await supabase.rpc('get_member_list_with_distance', {
        viewer_id: currentUser?.id || null
    })
    const enrichedProfile = distData?.find((p: EnrichedProfile) => p.id === id)
    const distance = enrichedProfile?.distance

    // Get badges
    const badges = await getUserBadges(id)

    // Get manner history
    const { data: mannerHistory } = await supabase
        .from('manner_score_history')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Get recent rounds
    // Get rounds (future and past)
    const { data: allRoundsData } = await supabase
        .from('participants')
        .select(`
            id,
            joined_at,
            event:events(
                id, 
                title, 
                start_date, 
                course_name,
                host:users(is_admin)
            )
        `)
        .eq('user_id', id)
        .order('event(start_date)', { ascending: false }) // Get all, sort by date implicitly (or filter later)

    // Type definition for the query result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RoundData = {
        id: string
        joined_at: string
        event: {
            id: string
            title: string
            start_date: string
            course_name: string
            host: { is_admin: boolean } | null
        }
    }

    const allRounds = (allRoundsData || []) as unknown as RoundData[]

    // Separate Future vs Past
    // Note: event might be null if left join fails, but participants must have event_id. 
    // Supabase filtering on nested json is tricky, doing it in JS is fine for now.
    const futureRounds = allRounds
        .filter(r => r.event && new Date(r.event.start_date) > new Date())
        .sort((a, b) => new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime())
        
    const pastRounds = allRounds
        .filter(r => r.event && new Date(r.event.start_date) <= new Date())
        .sort((a, b) => new Date(b.event.start_date).getTime() - new Date(a.event.start_date).getTime())

    // Separate Future Rounds into Official (Admin hosted) vs Friendly (User hosted)
    const officialRounds = futureRounds.filter(r => r.event.host?.is_admin)
    const friendlyRounds = futureRounds.filter(r => !r.event.host?.is_admin)
    
    // For backward compatibility with existing render code (if any left below), 
    // we can use pastRounds as 'recentRounds' but I will replace the render section too.

    // Check if blocked
    const isBlocked = profile.is_banned

    const distanceLabels: Record<number, { label: string, color: string, emoji: string }> = {
        1: { label: '1촌', color: 'emerald', emoji: '🤝' },
        2: { label: '2촌', color: 'blue', emoji: '👋' },
        3: { label: '3촌', color: 'purple', emoji: '🙂' },
    }
    const distInfo = distance ? distanceLabels[distance] || { label: `${distance}촌`, color: 'gray', emoji: '👤' } : null

    const isOwnProfile = currentUser?.id === id

    // Check pending sent request (only if not own profile)
    let isPending = false
    if (!isOwnProfile && currentUser) {
        const { data: relationship } = await supabase
            .from('relationships')
            .select('status')
            .eq('user_id', currentUser.id)
            .eq('friend_id', id)
            .maybeSingle()
        
        isPending = relationship?.status === 'pending'
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans">
            <PremiumSubHeader 
                title={profile.nickname} 
                backHref="/members"
                rightElement={
                    !isOwnProfile && <ConnectionRequestButton targetUserId={id} isAlreadyFriend={distance === 1} isPending={isPending} />
                }
            />

            <div className="pt-24" />

            {isBlocked && (
                <div className="mx-gutter mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <span className="text-red-400 text-xs font-bold font-sans">⚠️ 차단된 유저입니다</span>
                </div>
            )}

            {/* Profile Header */}
            <div className="px-gutter flex items-center justify-between">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-[var(--color-gray-100)] overflow-hidden border border-[var(--color-divider)]">
                        {profile.profile_img ? (
                            <img src={profile.profile_img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                        )}
                    </div>
                    {distInfo && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[var(--color-gray-200)] text-[var(--color-text-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--color-divider)] whitespace-nowrap`}>
                            {distInfo.emoji} {distInfo.label}
                        </div>
                    )}
                </div>

                <div className="flex-1 ml-4 mr-2 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm tracking-tight">
                            {profile.real_name || profile.nickname}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-1.5">
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">구력</span>
                            <span className="font-bold text-emerald-400">{profile.golf_experience || '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">핸디</span>
                            <span className="font-bold text-white">{profile.handicap !== null ? profile.handicap : '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">MBTI</span>
                            <span className="font-bold text-purple-400">{profile.mbti || '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">나이</span>
                            <span className="font-bold text-blue-300">{profile.age_range || '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">성별</span>
                            <span className="font-bold text-pink-300">{profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)] col-span-2 mt-1 pt-1 border-t border-white/5">
                             <span className="w-8 text-[var(--color-text-desc)] text-[10px]">거주</span>
                             <span className="font-bold text-gray-300">{profile.district || '미입력'}</span>
                        </div>
                    </div>
                </div>

                {profile.membership_level && (
                    <MembershipBadge 
                        level={profile.membership_level} 
                    />
                )}
            </div>

            {/* Score Cards */}
            <div className="px-gutter mt-8 grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                    <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold uppercase tracking-widest">Manner</div>
                    <div className={`text-2xl font-black ${profile.manner_score < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {profile.manner_score?.toLocaleString() || 0}
                    </div>
                    <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${profile.manner_score < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.max(0, Math.min(100, profile.manner_score || 0))}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)] relative overflow-hidden h-32">
                    <MannerHistoryGraph history={mannerHistory || []} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="px-gutter mt-10">
                <div className="bg-[var(--color-gray-100)] rounded-xl py-4 px-2 border border-[var(--color-divider)] grid grid-cols-3 divide-x divide-[var(--color-divider)]">
                    <div className="text-center">
                        <div className="text-[10px] text-[var(--color-text-desc)] font-bold mb-1">핸디캡</div>
                        <div className="text-sm font-black text-white">{profile.handicap !== null ? profile.handicap : '-'}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-[var(--color-text-desc)] font-bold mb-1">방개설</div>
                        <div className="text-sm font-black text-white">{profile.host_count || 0}회</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-[var(--color-text-desc)] font-bold mb-1">초대</div>
                        <div className="text-sm font-black text-white">{profile.invite_count || 0}회</div>
                    </div>
                </div>
            </div>

            {/* Participating Rounds (Future) */}
            <div className="px-gutter mt-10 space-y-8">
                {/* Official Rounds */}
                <div>
                     <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        사전예약된 일정 <span className="text-blue-500 text-xs ml-1">Official</span>
                    </h2>
                     <div className="space-y-3">
                        {officialRounds.length > 0 ? (
                            officialRounds.map((round) => (
                                <Link 
                                    href={`/rounds/${round.event.id}`}
                                    key={round.id}
                                    className="block bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-sm font-bold text-blue-100 truncate max-w-[70%]">{round.event.title}</div>
                                        <div className="text-[10px] text-blue-300 font-mono bg-blue-500/10 px-2 py-0.5 rounded-full">
                                            {new Date(round.event.start_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-xs text-blue-200/70 mt-1">
                                        📍 {round.event.course_name || '미정'}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-6 bg-[var(--color-gray-100)] rounded-xl border border-dashed border-[var(--color-divider)]">
                                <span className="text-xs text-[var(--color-text-desc)]">예약된 공식 일정이 없습니다.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Friendly Rounds */}
                <div>
                     <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        조인참가된 일정 <span className="text-emerald-500 text-xs ml-1">Join</span>
                    </h2>
                     <div className="space-y-3">
                        {friendlyRounds.length > 0 ? (
                            friendlyRounds.map((round) => (
                                <Link 
                                    href={`/rounds/${round.event.id}`}
                                    key={round.id}
                                    className="block bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)] active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-sm font-bold text-white truncate max-w-[70%]">{round.event.title}</div>
                                        <div className="text-[10px] text-[var(--color-text-desc)] font-mono">
                                            {new Date(round.event.start_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-xs text-[var(--color-text-desc)] mt-1">
                                        📍 {round.event.course_name || '미정'}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-6 bg-[var(--color-gray-100)] rounded-xl border border-dashed border-[var(--color-divider)]">
                                <span className="text-xs text-[var(--color-text-desc)]">참가중인 조인 라운딩이 없습니다.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Sponsor Badges Section */}
            {badges.length > 0 && (
                <div className="px-gutter mt-10">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        획득한 배지 <span className="text-amber-500">🏅</span>
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {badges.map((badge: Badge) => (
                            <Link
                                href={`/sponsors/${badge.sponsor_id}`}
                                key={badge.id}
                                className="flex-shrink-0 bg-[var(--color-gray-100)] p-3 rounded-lg border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)] transition-all w-24"
                            >
                                <div className="w-10 h-10 mx-auto bg-[var(--color-bg)] rounded-full flex items-center justify-center overflow-hidden mb-2">
                                    {badge.sponsor?.logo_url ? (
                                        <img src={badge.sponsor.logo_url} alt="" className="w-6 h-6 object-contain" />
                                    ) : (
                                        <span className="text-lg">🏆</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-center text-[var(--color-text-primary)] font-bold truncate">{badge.sponsor?.name}</div>
                                <div className="text-[9px] text-center text-[var(--color-text-desc)] mt-0.5 truncate">{badge.product?.name}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* MBTI & Preferences */}
            {(profile.mbti || profile.partner_style_preference?.length > 0) && (
                <div className="px-gutter mt-10">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3">플레이 스타일</h2>
                    <div className="bg-[var(--color-gray-100)] rounded-xl p-4 border border-[var(--color-divider)] space-y-4">
                        {profile.mbti && (
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--color-text-desc)] text-xs font-bold">MBTI</span>
                                <span className="text-purple-400 text-sm font-bold">
                                    {profile.mbti}
                                </span>
                            </div>
                        )}
                        {profile.partner_style_preference?.length > 0 && (
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-[var(--color-text-desc)] text-xs font-bold pt-1 shrink-0">선호 스타일</span>
                                <div className="flex gap-1.5 flex-wrap justify-end">
                                    {profile.partner_style_preference.map((style: string) => (
                                        <span key={style} className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-[10px] border border-[var(--color-divider)]">
                                            {style}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
