import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const events = [
    { id: 1, title: 'January Monthly Rounding', location: 'Parramatta Golf Club', date: 'Jan 24, 2024', participants: 3, max: 4 },
    { id: 2, title: 'Newbie Training Camp', location: 'Oak Valley Resort', date: 'Feb 10-11, 2024', participants: 8, max: 16 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
      </header>
      <div className="p-4 space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold">{event.title}</h3>
            <p className="text-gray-500 text-sm">{event.location}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
