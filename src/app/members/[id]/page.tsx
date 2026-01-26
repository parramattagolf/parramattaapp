/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import MemberDetailHeader from '@/components/members/member-detail-header'
import MembershipBadge from '@/components/members/membership-badge'
import MannerPulseGraph from '@/components/manner-pulse-graph'
import ProfileImageWithGlow from '@/components/members/profile-image-with-glow'
import MemberReservationTabs from '@/components/members/member-reservation-tabs'

interface EnrichedProfile {
    id: string;
    distance: number;
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

const MetricBar = ({ label, value, colorClass }: { label: string; value: number; colorClass: string }) => (
    <div className="flex flex-col gap-2 py-1 px-1">
        <div className="flex justify-between items-end bg-transparent px-0.5 mb-1">
            <span className="text-[13px] font-black text-white/90 tracking-tight">{label}</span>
        </div>
        
        <div className="h-[2px] w-full bg-white/5 rounded-full relative overflow-visible">
            {/* Background track */}
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            
            {/* Average Indicator (Vertical Line - Fixed at Center) */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-[1.5px] h-3 bg-white/20 z-0"
                style={{ left: `50%` }}
            />

            {/* Path from Min to Value (Subtle Glow) */}
            <div 
                className={`absolute left-0 top-0 h-full rounded-full opacity-30 ${colorClass}`}
                style={{ width: `${value}%` }}
            />
            
            {/* Position Indicator (The Premium Dot) */}
            <div 
                className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-[3.5px] border-[#121212] shadow-[0_0_15px_rgba(0,0,0,1)] transition-all duration-1000 ease-out z-10 ${colorClass}`}
                style={{ left: `calc(${Math.max(0, Math.min(100, value))}% - 7px)` }}
            >
                <div className="absolute inset-0 rounded-full bg-white/30 scale-[0.3]" />
            </div>
        </div>

        {/* Labels Underneath (Precisely Aligned) */}
        <div className="relative w-full h-3 mt-1.5 opacity-30">
            <span className="absolute left-0 top-0 text-[7px] font-black text-white tracking-widest uppercase">Min</span>
            <div 
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `50%` }}
            >
                <span className="text-[7px] font-black text-white tracking-widest uppercase">Average</span>
            </div>
            <span className="absolute right-0 top-0 text-[7px] font-black text-white tracking-widest uppercase">Max</span>
        </div>
    </div>
);

const getRelativePosition = (val: number | null, min: number, avg: number, max: number) => {
    if (val === null) return 0;
    
    // Check if range is reversed (e.g. handicap)
    const isReversed = min > max;
    
    if (isReversed) {
        if (val >= avg) {
            // Value is between Min(40) and Avg(20) -> e.g. 30
            const range = min - avg;
            if (range <= 0) return 50;
            return Math.max(0, ((min - val) / range) * 50);
        } else {
            // Value is between Avg(20) and Max(0) -> e.g. 10
            const range = avg - max;
            if (range <= 0) return 100;
            return Math.min(100, 50 + ((avg - val) / range) * 50);
        }
    } else {
        if (val <= avg) {
            const range = avg - min;
            if (range <= 0) return 50;
            return Math.max(0, ((val - min) / range) * 50);
        } else {
            const range = max - avg;
            if (range <= 0) return 100;
            return Math.min(100, 50 + ((val - avg) / range) * 50);
        }
    }
};

const getExperienceValue = (exp: string | null) => {
    if (!exp) return 0;
    if (exp.includes('1년')) return 1;
    if (exp.includes('3년')) return 3;
    if (exp.includes('5년')) return 5;
    if (exp.includes('10년')) return 10;
    return 2;
};

const getAgeValue = (age: string | null) => {
    if (!age) return 0;
    if (age.includes('20')) return 25;
    if (age.includes('30')) return 35;
    if (age.includes('40')) return 45;
    if (age.includes('50')) return 55;
    if (age.includes('60')) return 65;
    return 40;
};

const getHandicapValue = (h: number | null) => {
    if (h === null) return 20; // Default to average
    return h;
};

const getMannerValue = (s: number | null) => s ?? 100;
const getPointValue = (p: number | null) => p ?? 0;
const getCountValue = (count: number | null) => count ?? 0;

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
        .limit(20)

    // Calculate Global Averages for Stats Bar
    const { data: globalUsers } = await supabase
        .from('users')
        .select('manner_score, points, handicap, host_count, invite_count, age_range, golf_experience')

    const stats = {
        manner: { min: 0, avg: 100, max: 300 },
        points: { min: 0, avg: 500, max: 5000 },
        handicap: { min: 40, avg: 20, max: 0 }, // Reversed: 0 is Max skill
        host: { min: 0, avg: 5, max: 50 },
        invite: { min: 0, avg: 3, max: 30 },
        experience: { min: 1, avg: 5, max: 15 },
        age: { min: 20, avg: 40, max: 70 },
        preRes: { min: 0, avg: 2, max: 20 },
        join: { min: 0, avg: 8, max: 80 }
    }

    if (globalUsers && globalUsers.length > 0) {
        const getAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
        const getValid = (arr: (number | null)[]) => arr.filter(v => v !== null) as number[]

        const manners = getValid(globalUsers.map(u => u.manner_score))
        const pts = getValid(globalUsers.map(u => u.points))
        const hcp = getValid(globalUsers.map(u => u.handicap))
        const hosts = getValid(globalUsers.map(u => u.host_count))
        const invites = getValid(globalUsers.map(u => u.invite_count))
        const exps = getValid(globalUsers.map(u => getExperienceValue(u.golf_experience)))
        const ages = getValid(globalUsers.map(u => getAgeValue(u.age_range)))
        
        if (manners.length) {
            stats.manner.avg = getAvg(manners)
            stats.manner.max = Math.max(...manners, 300)
        }
        if (pts.length) {
            stats.points.avg = getAvg(pts)
            stats.points.max = Math.max(...pts, 5000)
        }
        if (hcp.length) {
            stats.handicap.avg = getAvg(hcp)
            stats.handicap.min = Math.max(...hcp, 40) // Worst
            stats.handicap.max = Math.min(...hcp, 0)  // Best
        }
        if (hosts.length) {
            stats.host.avg = getAvg(hosts)
            stats.host.max = Math.max(...hosts, 50)
        }
        if (invites.length) {
            stats.invite.avg = getAvg(invites)
            stats.invite.max = Math.max(...invites, 30)
        }
        if (exps.length) {
            stats.experience.avg = getAvg(exps)
            stats.experience.max = Math.max(...exps, 15)
        }
        if (ages.length) {
            stats.age.avg = getAvg(ages)
            stats.age.max = Math.max(...ages, 70)
        }
    }

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


    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-32 font-sans">
            <MemberDetailHeader 
                nickname={profile.nickname} 
                targetUserId={id} 
                isOwnProfile={isOwnProfile} 
                distance={distance} 
                isPending={isPending} 
            />

            <div className="pt-16" />

            {isBlocked && (
                <div className="mx-gutter mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <span className="text-red-400 text-xs font-bold font-sans">⚠️ 차단된 유저입니다</span>
                </div>
            )}

            {/* Profile Header - Optimized & Premium */}
            <div className="px-gutter flex items-center justify-between">
                <ProfileImageWithGlow 
                    profileImg={profile.profile_img} 
                    distInfo={distInfo} 
                />

                <div className="flex-shrink-0">
                    {profile.membership_level && (
                        <MembershipBadge 
                            level={profile.membership_level} 
                        />
                    )}
                </div>
            </div>


            {/* Member Stats - Normalized Relative Bars (Average is exactly in the center) */}
            <div className="px-gutter mt-10 space-y-10">
                <div className="space-y-2">
                    <MannerPulseGraph history={mannerHistory || []} />
                    <MetricBar 
                        label="구력" 
                        value={getRelativePosition(getExperienceValue(profile.golf_experience), stats.experience.min, stats.experience.avg, stats.experience.max)} 
                        colorClass="bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                    />
                </div>
                <MetricBar 
                    label="핸디" 
                    value={getRelativePosition(getHandicapValue(profile.handicap), stats.handicap.min, stats.handicap.avg, stats.handicap.max)} 
                    colorClass="bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                />
                <MetricBar 
                    label="나이" 
                    value={getRelativePosition(getAgeValue(profile.age_range), stats.age.min, stats.age.avg, stats.age.max)} 
                    colorClass="bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]"
                />
                <MetricBar 
                    label="매너점수" 
                    value={getRelativePosition(getMannerValue(profile.manner_score), stats.manner.min, stats.manner.avg, stats.manner.max)} 
                    colorClass="bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                />
                <MetricBar 
                    label="포인트" 
                    value={getRelativePosition(getPointValue(profile.points), stats.points.min, stats.points.avg, stats.points.max)} 
                    colorClass="bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]"
                />
                
                <MetricBar 
                    label="방장" 
                    value={getRelativePosition(getCountValue(profile.host_count), stats.host.min, stats.host.avg, stats.host.max)} 
                    colorClass="bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"
                />
                <MetricBar 
                    label="초대" 
                    value={getRelativePosition(getCountValue(profile.invite_count), stats.invite.min, stats.invite.avg, stats.invite.max)} 
                    colorClass="bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                />
                <MetricBar 
                    label="사전예약" 
                    value={getRelativePosition(getCountValue(preReservations.length), stats.preRes.min, stats.preRes.avg, stats.preRes.max)} 
                    colorClass="bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                />
                <MetricBar 
                    label="조인참가" 
                    value={getRelativePosition(getCountValue(friendlyRounds.length), stats.join.min, stats.join.avg, stats.join.max)} 
                    colorClass="bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                />
            </div>


            {/* Reservation Tabs */}
            <MemberReservationTabs 
                preReservations={preReservations} 
                friendlyRounds={friendlyRounds} 
            />



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
