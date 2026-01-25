'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function RoundFilter({ themes = [], activeTheme = 'all' }: { themes?: string[], activeTheme?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentTheme = searchParams.get('theme') || activeTheme

  const handleThemeChange = (theme: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (theme === 'all') {
      params.delete('theme')
    } else {
      params.set('theme', theme)
    }
    router.push(`/rounds?${params.toString()}`)
  }

  const allThemes = ['all', ...themes]

  return (
    <div className="fixed top-[50px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[80] bg-[#121212] border-b border-white/10 py-4 font-sans transition-all duration-300">
      <div className="relative w-full px-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {allThemes.map((theme) => {
            const isActive = currentTheme === theme
            return (
              <button
                key={theme}
                data-active={isActive}
                onClick={() => handleThemeChange(theme)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-500/50'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/5'
                }`}
              >
                {theme === 'all' ? '전체' : theme}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
