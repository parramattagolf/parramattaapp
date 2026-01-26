/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import MemberDetailHeader from '@/components/members/member-detail-header'
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
        .limit(10)

    // Get recent rounds
    // Get rounds (future and past)
    const { data: allRoundsData } = await supabase
        .from('participants')
        .select(`
            id,
            joined_at,
            payment_status,
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
        payment_status: string
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

    // 3. Get Pre-reservations (Interest / Interest expressed)
    const { data: preReservationData } = await supabase
        .from('pre_reservations')
        .select(`
            id,
            created_at,
            event:events(
                id, 
                title, 
                start_date, 
                course_name,
                event_type,
                host:users(is_admin)
            )
        `)
        .eq('user_id', id)

    type PreResData = {
        id: string
        created_at: string
        event: {
            id: string
            title: string
            start_date: string
            course_name: string
            event_type: string | null
            host: { is_admin: boolean } | null
        }
    }

    const preReservations = (preReservationData || []) as unknown as PreResData[]

    // Official section -> Showing Pre-reservations (Interest expressed)
    
    // Join section -> Future rounds where user is a participant
    const friendlyRounds = futureRounds
    
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

    // 3. Calculate 24-Week Data (Past 12 weeks ~ Future 12 weeks)
    const now = new Date()
    const weeks: { weekLabel: string; joinCount: number; preResCount: number; isCurrent: boolean }[] = []
    
    // Range from i=12 (12 weeks ago) to i=-11 (11 weeks ahead) = total 24 weeks
    for (let i = 12; i >= -11; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - (i * 7 + now.getDay())) // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        const joinCount = allRounds.filter(r => {
            if (!r.event) return false
            const rd = new Date(r.event.start_date)
            return rd >= weekStart && rd <= weekEnd
        }).length

        const preResCount = preReservations.filter(p => {
            if (!p.event) return false
            const rd = new Date(p.event.start_date)
            return rd >= weekStart && rd <= weekEnd
        }).length

        weeks.push({
            weekLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            joinCount,
            preResCount,
            isCurrent: i === 0
        })
    }

    const maxCount = Math.max(...weeks.map(w => w.joinCount + w.preResCount), 1)
    const totalActivity = weeks.reduce((sum, w) => sum + w.joinCount + w.preResCount, 0)

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-32 font-sans">
            <MemberDetailHeader 
                nickname={profile.nickname} 
                targetUserId={id} 
                isOwnProfile={isOwnProfile} 
                distance={distance} 
                isPending={isPending} 
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
                        <div className="bg-blue-600/10 text-blue-400 text-[9px] font-black px-2.5 py-1 rounded-full border border-blue-500/20 shadow-sm tracking-tight flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                            실명은 모든 회원이 비공개입니다
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
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">나이</span>
                            <span className="font-bold text-blue-300">{profile.age_range || '-'}</span>
                        </div>
                        <div className="flex items-center text-[var(--color-text-secondary)]">
                            <span className="w-8 text-[var(--color-text-desc)] text-[10px]">성별</span>
                            <span className="font-bold text-pink-300">{profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '-'}</span>
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

            {/* Participation Rate Graph (24-Week Activity) */}
            <div className="px-gutter mt-10">
                 <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-black text-white">과거 12주 & 향후 12주 현황</h2>
                            <p className="text-[11px] text-white/40 mt-1">24주간 총 <b className="text-blue-400">{totalActivity}회</b> 참여 진행 중</p>
                        </div>
                    </div>

                    {/* Bar Chart Container */}
                    <div className="flex items-end justify-between gap-[3px] h-24 mb-4">
                        {weeks.map((week, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                                {/* Tooltip on hover (mobile might ignore, but nice for logic) */}
                                <div className="invisible group-hover:visible absolute -top-8 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap">
                                    {week.weekLabel}: {week.joinCount + week.preResCount}회
                                </div>
                                
                                 {/* Stacked Bar Container */}
                                 <div className="w-full flex flex-col justify-end gap-[1px] h-full">
                                     {week.preResCount > 0 && (
                                         <div 
                                             className="w-full bg-blue-500 rounded-sm"
                                             style={{ height: `${(week.preResCount / maxCount) * 100}%` }}
                                         />
                                     )}
                                     {week.joinCount > 0 && (
                                         <div 
                                             className={`w-full rounded-sm ${week.isCurrent ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-emerald-600'}`}
                                             style={{ height: `${(week.joinCount / maxCount) * 100}%` }}
                                         />
                                     )}
                                     {week.joinCount === 0 && week.preResCount === 0 && (
                                         <div className="w-full bg-white/[0.03] h-[10%] rounded-sm" />
                                     )}
                                 </div>
                                
                                {idx % 4 === 0 && (
                                    <span className="text-[8px] text-white/10 font-bold mt-2 transform scale-75">
                                        {week.weekLabel}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[9px] text-white/30 font-bold">조인참가</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span className="text-[9px] text-white/30 font-bold">사전예약</span>
                            </div>
                        </div>
                        <span className="text-[9px] text-white/20 italic font-black">과거 12주 & 향후 12주 참가현황</span>
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
                        {preReservations.length > 0 ? (
                            preReservations.map((pre) => (
                                <Link 
                                    href={`/rounds/${pre.event.id}`}
                                    key={pre.id}
                                    className="block bg-purple-500/5 p-4 rounded-xl border border-purple-500/20 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col gap-1 max-w-[70%]">
                                            <div className="text-lg font-bold text-purple-100 truncate">{pre.event.title}</div>
                                            <div className="text-[10px] text-purple-400 font-medium">
                                                예약: {new Date(pre.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-purple-300 font-mono">
                                            {new Date(pre.event.start_date).toLocaleDateString()}
                                        </div>
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
                                    className={`block p-4 rounded-xl border active:scale-[0.98] transition-all ${
                                        round.payment_status !== 'paid' 
                                            ? 'bg-red-500/5 border-red-500/20' 
                                            : 'bg-[var(--color-gray-100)] border-[var(--color-divider)]'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col gap-1 max-w-[70%]">
                                            <div className="text-sm font-bold text-white truncate">{round.event.title}</div>
                                            {round.payment_status !== 'paid' && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                    <span className="text-[10px] text-red-400 font-black uppercase">결제 대기중</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-[var(--color-text-desc)] font-mono">
                                            {new Date(round.event.start_date).toLocaleDateString()}
                                        </div>
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

        </div>
    )
}
