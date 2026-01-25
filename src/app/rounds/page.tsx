import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import MonthSection from '@/components/rounds/month-section'
import RoundFilter from '@/components/rounds/round-filter'
import { Suspense } from 'react'

export const revalidate = 0

export default async function RoundsPage({ searchParams }: { searchParams: Promise<{ view?: string; theme?: string }> }) {
  const { view, theme } = await searchParams
  const supabase = await createClient()

  // Fetch unique themes for the filter
  const { data: themesData } = await supabase
    .from('events')
    .select('theme')
    .not('theme', 'is', null)
  
  const uniqueThemes = Array.from(new Set(themesData?.map(t => t.theme) || [])).sort()

  // Fetch all columns from 'events' and join host/sponsor info
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      host:users!events_host_id_fkey (id, nickname, profile_img),
      sponsor:sponsors (id, name, logo_url)
    `)
    .order('created_at', { ascending: false }) // Temporary order to find the latest
    // Note: We'll re-sort in memory for the start_date display

  if (error) {
    console.error('Error fetching events:', error)
  }

  const allEvents = events || []
  
  // Default theme is always 'all' (전체보기)
  const defaultTheme = 'all'
  const activeTheme = theme || defaultTheme

  // Now sort by start_date for display
  const sortedEvents = [...allEvents].sort((a, b) => {
    const timeA = new Date(a.start_date).getTime()
    const timeB = new Date(b.start_date).getTime()
    if (view === 'past') return timeB - timeA
    return timeA - timeB
  })

  const now = new Date()

  // Apply theme filter using activeTheme
  const baseFilteredList = activeTheme !== 'all' 
    ? sortedEvents.filter(e => e.theme === activeTheme) 
    : sortedEvents

  // Filter based on the view
  const filteredList = view === 'past'
    ? baseFilteredList.filter(e => new Date(e.start_date) < now && e.is_public)
    : baseFilteredList.filter(e => new Date(e.start_date) >= now && e.is_public)

  // Fetch participant counts and pre-reservation counts for all events
  const eventWithCounts = await Promise.all(
    filteredList.map(async (event) => {
      const { count: participantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)

      const { count: preReservationCount } = await supabase
        .from('pre_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)

      return {
        ...event,
        participant_count: participantCount || 0,
        pre_reservation_count: preReservationCount || 0
      }
    })
  )

  // Group filtered events by month (using the enriched ones)
  const groupedEventsWithCounts: Record<string, (typeof eventWithCounts[0])[]> = {}
  eventWithCounts.forEach(event => {
    const monthYear = format(new Date(event.start_date), 'yyyy년 M월', { locale: ko })
    if (!groupedEventsWithCounts[monthYear]) {
      groupedEventsWithCounts[monthYear] = []
    }
    groupedEventsWithCounts[monthYear].push(event)
  })

  // Sort months
  const months = Object.keys(groupedEventsWithCounts).sort((a, b) => {
    if (view === 'past') return b.localeCompare(a)
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-[#121212] pb-32 font-sans overflow-x-hidden pt-[180px]">
      <Suspense fallback={<div className="fixed top-[51px] left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[120px] bg-[#121212] border-b border-white/10 z-[89]" />}>
        <RoundFilter themes={uniqueThemes} activeTheme={activeTheme} />
      </Suspense>
      <main className="space-y-12 mt-0 px-0">
        {months.length > 0 ? (
          months.map(month => (
            <MonthSection key={month} month={month} events={groupedEventsWithCounts[month]} view={view} />
          ))
        ) : (
          <div className="py-40 px-10 text-center animate-fade-in">
            <div className="relative inline-block mb-8">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10 shadow-2xl">
                <span className="text-4xl filter grayscale opacity-40">⛳</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-[#121212]">
                <span className="text-white text-[10px] font-black">!</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {view === 'past' ? '지난 일정이 없습니다' : '라운딩 일정이 없습니다'}
            </h3>
            <p className="text-white/40 text-sm font-medium leading-relaxed">
              {view === 'past'
                ? '기록된 과거 데이터가 없습니다.'
                : '현재 준비된 라운딩 일정이 없습니다.\n새로운 일정이 등록되면 알려드릴게요.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
