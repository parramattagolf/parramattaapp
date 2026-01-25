import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import { Bell, Settings } from 'lucide-react'
import MyScoreDashboard from '@/components/my/my-score-dashboard'
import MyYoutubeEmbed from '@/components/my/my-youtube-embed'
import MembershipBadge from '@/components/members/membership-badge'
import ScoreRulesSummary from '@/components/my/score-rules-summary'
import MyWarningPopup from '@/components/my/my-warning-popup'

// ============================================
// 🔒 개발용: SHOW_KAKAO_ID를 false로 설정하면 
// 카카오 고유번호가 화면에서 숨겨집니다.
// ============================================
const SHOW_KAKAO_ID = false // TODO: 프로덕션에서는 false로 변경

export default async function MyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get user metadata from auth (for immediate display)
    const authMetadata = user.user_metadata || {}

    // Get avatar from various possible fields
    const authAvatar = authMetadata.avatar_url
        || authMetadata.picture
        || authMetadata.kakao_account?.profile?.profile_image_url
        || null

    // Get name from various possible fields
    const authName = authMetadata.full_name
        || authMetadata.name
        || authMetadata.kakao_account?.profile?.nickname
        || authMetadata.preferred_username
        || null

    // Get email
    const authEmail = user.email
        || authMetadata.email
        || authMetadata.kakao_account?.email
        || null

    // ============================================
    // 🔒 카카오 고유번호 추출 (나중에 숨길 수 있음)
    // ============================================
    const kakaoId = authMetadata.provider_id
        || authMetadata.sub
        || authMetadata.id
        || null

    // Get user data from public.users table
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // Merge auth data with DB data (DB takes precedence for consistency)
    const displayName = userData?.nickname || authName || '닉네임 없음'
    const displayAvatar = userData?.profile_img || authAvatar || null
    const displayEmail = userData?.email || authEmail || null
    const displayJob = userData?.job || null
    const displayGolfExp = userData?.golf_experience || null
    const mannerScore = userData?.manner_score ?? 100
    const currentPoints = userData?.points || 0

    // 카카오 ID: DB에서 가져오거나 메타데이터에서 추출
    const displayKakaoId = userData?.kakao_id || kakaoId

    const realName = userData?.real_name || ''
    const gender = userData?.gender || ''
    const ageRange = userData?.age_range || ''
    const district = userData?.district || ''
    const mbti = userData?.mbti || ''
    const handicap = userData?.handicap !== null ? userData?.handicap : null
    const membershipLevel = userData?.membership_level || null

    // Calculate Manner Score Percentile
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    const { count: higherMannerScorers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('manner_score', mannerScore)

    const mannerRank = (higherMannerScorers || 0) + 1
    const percentile = totalUsers ? Math.ceil((mannerRank / totalUsers) * 100) : 100

    // Calculate Point Rank (Seed Rank)
    const { count: higherPointScorers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('points', currentPoints)

    const pointRank = (higherPointScorers || 0) + 1

    // Get badges
    const badges = await getUserBadges(user.id)

    // Get network stats
    const { data: friends } = await supabase.rpc('get_member_list_with_distance', { viewer_id: user.id })
    const networkStats = {
        total: friends?.filter((f: any) => f.distance && f.distance < 999).length || 0,
    }

    // Get rounds
    const { data: rounds } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)

    // Get unread notifications count
    const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`receiver_id.eq.${user.id},type.eq.global`)
        .eq('is_read', false)

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans pt-24">
            {/* Profile Header */}
            <div className="bg-[var(--color-bg)]">
                <div className="px-gutter py-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 h-24 rounded-[32px] bg-[#1c1c1e] overflow-hidden border-2 border-white/5 flex-shrink-0 shadow-2xl relative group transition-transform hover:scale-105 duration-500">
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 opacity-60"></div>
                                {displayAvatar ? (
                                    <img
                                        src={displayAvatar}
                                        alt="프로필 사진"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">
                                        👤
                                    </div>
                                )}
                            </div>
                            {/* Real Name under Avatar + Settings */}
                            {/* Name & Nickname Display */}
                            {/* Name & Nickname Display */}
                            <div className="flex flex-col items-center mt-2">
                                {/* Primary Name (Real Name Priority) */}
                                <div className="flex items-center gap-1.5">
                                    <div className="text-[16px] font-bold text-white/90 tracking-tight">
                                        {/* 실명(realName)을 최우선으로, 없으면 닉네임 표시 */}
                                        {realName || displayName}
                                    </div>
                                    <Link
                                        href="/settings"
                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                                    >
                                        <Settings size={12} />
                                    </Link>
                                </div>
                                
                                {/* Secondary Display (Nickname below, if Real Name exists) */}
                                {realName && realName !== displayName && (
                                    <div className="text-[12px] text-[#A1A1AA] font-normal tracking-wide">
                                        @{displayName}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2" id="header_info">



                            {SHOW_KAKAO_ID && displayKakaoId && (
                                <KakaoIdDisplay kakaoId={displayKakaoId} />
                            )}

                            <div className="flex flex-col gap-1 mt-1">
                                {/* 1. Golf Experience */}
                                {displayGolfExp && (
                                    <span className="text-[14px] text-blue-400 font-bold">구력 {displayGolfExp}</span>
                                )}
                                
                                {/* 2. Handicap */}
                                {handicap !== null && (
                                    <span className="text-[14px] text-emerald-400 font-bold tracking-tight">핸디 {handicap}</span>
                                )}

                                {/* 3. Interest */}
                                <span className="text-[14px] text-white/90 font-bold">{displayJob || '미입력'}</span>
                            </div>
                        </div>

                        {/* Membership Badge (Far Right Column) */}
                        {membershipLevel && (
                             <MembershipBadge 
                                level={membershipLevel} 
                                className="shrink-0 self-start mt-2"
                            />
                        )}
                    </div>
                </div>

                {/* Score Cards (Kakao Style - Minimal) */}
                <MyScoreDashboard
                    mannerScore={mannerScore}
                    points={userData?.points || 0}
                    mannerPercentile={percentile}
                    pointRank={pointRank}
                />
            </div>


            {/* Sponsor Badges */}
            {badges.length > 0 && (
                <div className="px-gutter mt-10">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">보유 배지</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {badges.map((badge: any) => (
                            <div
                                key={badge.id}
                                className="bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] flex-shrink-0 w-20 p-3 text-center"
                            >
                                <div className="w-10 h-10 mx-auto bg-[var(--color-bg)] rounded-full flex items-center justify-center mb-2 overflow-hidden">
                                    {badge.sponsor?.logo_url ? (
                                        <img
                                            src={badge.sponsor.logo_url}
                                            alt=""
                                            className="w-6 h-6 object-contain"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="text-lg">🏅</span>
                                    )}
                                </div>
                                <div className="text-[9px] text-[var(--color-text-desc)] font-bold truncate">{badge.sponsor?.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions (Kakao Style List) */}
            <div className="px-gutter mt-4 space-y-2">
                <Link href="/notifications" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell size={20} className={`text-white/60 ${(unreadCount || 0) > 0 ? 'animate-[swing_1s_ease-in-out_infinite]' : ''}`} />
                            {(unreadCount || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#121212] flex items-center justify-center">
                                    <span className="text-[6px] text-white font-bold"></span>
                                </span>
                            )}
                        </div>
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">최근메세지</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {(unreadCount || 0) > 0 && (
                            <span className="text-[13px] font-bold text-red-500">{(unreadCount || 0) > 9 ? '9+' : unreadCount}건</span>
                        )}
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
                <Link href="/my/rounds" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">⛳</span>
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">나의 라운딩</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-blue-400">{rounds?.length || 0}건</span>
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
                <Link href="/my/network" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🤝</span>
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">나의 인맥</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-blue-400">{networkStats.total}명</span>
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
                <Link href="/my/sponsors" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🏆</span>
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">나의 스폰서</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-yellow-500">{badges.length}개</span>
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
            </div>

            {/* Negative Manner Score Warning Popup */}
            <MyWarningPopup mannerScore={mannerScore} />

            {/* Member Video Recommended for User */}
            <MyYoutubeEmbed nickname={displayName} />

            {/* Score & Points Policy Summary */}
            <ScoreRulesSummary />
        </div>
    )
}

// ============================================
// 🔒 카카오 고유번호 컴포넌트 (분리됨 - 나중에 쉽게 삭제 가능)
// ============================================
function KakaoIdDisplay({ kakaoId }: { kakaoId: string | number }) {
    return (
        <div className="inline-flex items-center gap-1.5 mt-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
            <span className="text-[10px] text-yellow-500 font-bold">카카오</span>
            <span className="text-[10px] font-mono text-yellow-500/80">{kakaoId}</span>
        </div>
    )
}
