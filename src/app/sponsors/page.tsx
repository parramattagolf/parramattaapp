import { createClient } from '@/utils/supabase/server'
import SponsorContent from '@/components/sponsors/sponsor-content'
interface Sponsor {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
}

export default async function SponsorsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const params = await searchParams
    const isTournaments = params.tab === 'tournaments'
    const supabase = await createClient()

    // 1. Fetch currently active sponsors from events
    const { data: activeEvents } = await supabase
        .from('events')
        .select('sponsor_id')
        .not('sponsor_id', 'is', null)

    const activeSponsorIds: string[] = [...new Set(activeEvents?.map(e => e.sponsor_id) || [])]

    // 2. Fetch all sponsors
    const { data: sponsors, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name', { ascending: true })

    if (error) console.error('Error fetching sponsors:', error)

    const allSponsors = (sponsors || []) as Sponsor[]

    // 3. Separate and prioritize active sponsors
    const prioritySponsors = allSponsors.filter(s => activeSponsorIds.includes(s.id))
    const regularSponsors = allSponsors.filter(s => !activeSponsorIds.includes(s.id))

    return (
        <div className={`min-h-screen bg-[var(--color-bg)] font-sans ${isTournaments ? 'pt-0 pb-0' : 'pt-14 pb-24'}`}>
            <SponsorContent 
                prioritySponsors={prioritySponsors}
                regularSponsors={regularSponsors}
            />
        </div>
    )
}
