import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserBadges } from '@/actions/sponsor-actions'
import PremiumSubHeader from '@/components/premium-sub-header'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Get profile with distance
    const { data: profiles } = await supabase.rpc('get_member_list_with_distance', {
        viewer_id: currentUser?.id || null
    })

    const profile = profiles?.find((p: any) => p.id === id)
    if (!profile) notFound()

    // Get badges
    const badges = await getUserBadges(id)

    // Check if blocked
    const isBlocked = profile.is_banned

    const distanceLabels: Record<number, { label: string, color: string, emoji: string }> = {
        1: { label: '1촌', color: 'emerald', emoji: '🤝' },
        2: { label: '2촌', color: 'blue', emoji: '👋' },
        3: { label: '3촌', color: 'purple', emoji: '🙂' },
    }
    const distInfo = profile.distance ? distanceLabels[profile.distance] || { label: `${profile.distance}촌`, color: 'gray', emoji: '👤' } : null

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans">
            <PremiumSubHeader title="" backHref="/members" />

            <div className="pt-24" />

            {isBlocked && (
                <div className="mx-4 mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <span className="text-red-400 text-xs font-bold font-sans">⚠️ 차단된 유저입니다</span>
                </div>
            )}

            {/* Profile Header */}
            <div className="px-4 flex flex-col items-center">
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

                <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-6">{profile.nickname}</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">{profile.job || '직업 미입력'}</p>
                {profile.golf_experience && (
                    <p className="text-emerald-400 text-xs mt-1 font-bold">⛳ {profile.golf_experience}</p>
                )}
            </div>

            {/* Score Cards */}
            <div className="px-4 mt-8 grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                    <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold">매너 점수</div>
                    <div className="text-2xl font-bold text-emerald-500">{profile.manner_score || 0}</div>
                    <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, profile.manner_score || 0)}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[var(--color-gray-100)] p-4 rounded-xl border border-[var(--color-divider)]">
                    <div className="text-[11px] text-[var(--color-text-desc)] mb-1 font-bold">베스트 드레서</div>
                    <div className="text-2xl font-bold text-pink-500">{profile.best_dresser_score || 0}</div>
                    <div className="mt-2 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-pink-500 rounded-full"
                            style={{ width: `${Math.min(100, profile.best_dresser_score || 0)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sponsor Badges Section */}
            {badges.length > 0 && (
                <div className="px-4 mt-10">
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        이 유저의 배지 <span className="text-amber-500">🏅</span>
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {badges.map((badge: any) => (
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
                <div className="px-4 mt-10">
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

            {/* Actions */}
        </div>
    )
}
