import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import { Bell } from 'lucide-react'

// ============================================
// 🔒 개발용: SHOW_KAKAO_ID를 false로 설정하면 
// 카카오 고유번호가 화면에서 숨겨집니다.
// ============================================
const SHOW_KAKAO_ID = true // TODO: 프로덕션에서는 false로 변경

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

    // Merge auth data with DB data (auth takes precedence for fresh data)
    const displayName = authName || userData?.nickname || '닉네임 없음'
    const displayAvatar = authAvatar || userData?.profile_img || null
    const displayEmail = authEmail || userData?.email || null
    const displayJob = userData?.job || null
    const displayGolfExp = userData?.golf_experience || null
    const mannerScore = userData?.manner_score || 100
    const bestDresserScore = userData?.best_dresser_score || 0

    // 카카오 ID: DB에서 가져오거나 메타데이터에서 추출
    const displayKakaoId = userData?.kakao_id || kakaoId

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

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans pt-24">
            {/* Profile Header */}
            <div className="bg-[var(--color-bg)]">
                <div className="px-5 py-8">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-[var(--color-gray-100)] overflow-hidden border border-[var(--color-divider)] flex-shrink-0">
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
                        <div className="flex-1 min-w-0" id="header_info">
                            <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate">{displayName}</h1>

                            {displayEmail && (
                                <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5 truncate">{displayEmail}</p>
                            )}

                            {SHOW_KAKAO_ID && displayKakaoId && (
                                <KakaoIdDisplay kakaoId={displayKakaoId} />
                            )}

                            <p className="text-[13px] text-[var(--color-text-desc)] mt-1">{displayJob || '직업 미입력'}</p>

                            {displayGolfExp && (
                                <p className="text-[12px] text-blue-400 font-bold mt-1">⛳ {displayGolfExp}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Cards (Kakao Style - Minimal) */}
                <div className="px-5 pb-8 grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                        <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold">매너 점수</div>
                        <div className="text-2xl font-bold text-emerald-500">{mannerScore}</div>
                        <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, mannerScore)}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                        <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold">베스트 드레서</div>
                        <div className="text-2xl font-bold text-pink-500">{bestDresserScore}</div>
                        <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-pink-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, bestDresserScore)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>


            {/* Sponsor Badges */}
            {badges.length > 0 && (
                <div className="px-5 mt-10">
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
            <div className="px-5 mt-4 space-y-2">
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
                <Link href="/my/rounds" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">⛳</span>
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">라운딩 참여 기록</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-blue-400">{rounds?.length || 0}건</span>
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
                <Link href="/notifications" className="flex items-center justify-between p-4 bg-[var(--color-gray-100)] rounded-xl border border-[var(--color-divider)] active:bg-[var(--color-surface-hover)]">
                    <div className="flex items-center gap-3">
                        <Bell size={20} className="text-white/60" />
                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">최근메세지</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[var(--color-text-desc)] text-xs">→</span>
                    </div>
                </Link>
            </div>

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
