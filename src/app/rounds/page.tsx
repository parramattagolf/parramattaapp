import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import MonthSection from '@/components/rounds/month-section'

export const revalidate = 0

export default async function RoundsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const supabase = await createClient()

  // Fetch all columns from 'events' and join host/sponsor info
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      host:users!events_host_id_fkey (id, nickname, profile_img),
      sponsor:sponsors (id, name, logo_url)
    `)
    .order('start_date', { ascending: view === 'past' ? false : true })

  if (error) {
    console.error('Error fetching events:', error)
  }

  const now = new Date()
  const list = events || []

  // Filter based on the view
  const filteredList = view === 'past'
    ? list.filter(e => new Date(e.start_date) < now)
    : list.filter(e => new Date(e.start_date) >= now)

  // Group filtered events by month
  const groupedEvents: Record<string, any[]> = {}
  filteredList.forEach(event => {
    const monthYear = format(new Date(event.start_date), 'yyyy년 M월', { locale: ko })
    if (!groupedEvents[monthYear]) {
      groupedEvents[monthYear] = []
    }
    groupedEvents[monthYear].push(event)
  })

  // Sort months for past view (descending) or upcoming view (ascending)
  const months = Object.keys(groupedEvents).sort((a, b) => {
    if (view === 'past') return b.localeCompare(a)
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-[#121212] pb-32 font-sans overflow-x-hidden pt-24">
      <main className="space-y-12">
        {months.length > 0 ? (
          months.map(month => (
            <MonthSection key={month} month={month} events={groupedEvents[month]} view={view} />
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
