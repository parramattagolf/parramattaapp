import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import SponsorVideoList from '@/components/sponsors/sponsor-video-list'

export default async function SponsorsPage() {
    const supabase = await createClient()

    // 1. Fetch currently active sponsors from events
    const { data: activeEvents } = await supabase
        .from('events')
        .select('sponsor_id')
        .not('sponsor_id', 'is', null)

    const activeSponsorIds = [...new Set(activeEvents?.map(e => e.sponsor_id) || [])]

    // 2. Fetch all sponsors
    const { data: sponsors, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name', { ascending: true })

    if (error) console.error('Error fetching sponsors:', error)

    const allSponsors = sponsors || []

    // 3. Separate and prioritize active sponsors
    const prioritySponsors = allSponsors.filter(s => activeSponsorIds.includes(s.id))
    const regularSponsors = allSponsors.filter(s => !activeSponsorIds.includes(s.id))

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans pt-24">
            {/* Priority Section (Active Sponsors) */}
            {prioritySponsors.length > 0 && (
                <div className="mb-4">
                    <div className="divide-y divide-[var(--color-divider)]">
                        {prioritySponsors.map((sponsor: any) => (
                            <SponsorItem key={sponsor.id} sponsor={sponsor} isActive={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Section */}
            <div className="divide-y divide-[var(--color-divider)]">
                {regularSponsors.map((sponsor: any) => (
                    <SponsorItem key={sponsor.id} sponsor={sponsor} isActive={false} />
                ))}
            </div>
            
            {/* Sponsor Playlist Video */}
            <div className="px-5">
                <SponsorVideoList />
            </div>
        </div>
    )
}

function SponsorItem({ sponsor, isActive }: { sponsor: any, isActive: boolean }) {
    return (
        <Link
            href={`/sponsors/${sponsor.id}`}
            className="flex items-center gap-4 py-4 px-0 active:bg-[var(--color-surface-hover)] transition-colors"
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
                <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    Official
                </div>
            </div>
        </Link>
    )
}
