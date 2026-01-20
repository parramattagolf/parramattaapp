export function EventCard({
  title,
  date,
  location,
  participants,
}: {
  title: string
  date: string
  location: string
  participants: number
}) {
  return (
    <div className="glass p-5 rounded-2xl flex flex-col gap-3 hover:scale-[1.02] transition-transform cursor-pointer">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg text-primary-foreground">{title}</h3>
        <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-md text-zinc-300">
          Open
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {date}
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-background flex items-center justify-center text-[10px]"
            >
              U{i}
            </div>
          ))}
          {participants > 3 && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-background flex items-center justify-center text-[10px]">
              +{participants - 3}
            </div>
          )}
        </div>
        <span className="text-sm font-semibold text-primary-foreground">
          {participants} Joined
        </span>
      </div>
    </div>
  )
}
