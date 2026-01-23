'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function RoundFilter({ themes = [], activeTheme = 'all' }: { themes?: string[], activeTheme?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  
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

  useEffect(() => {
    if (containerRef.current) {
      const activeBtn = containerRef.current.querySelector('[data-active="true"]')
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentTheme])

  const allThemes = ['all', ...themes]

  return (
    <div className="fixed top-[51px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[90] bg-[#121212]/90 backdrop-blur-2xl border-b border-white/10 py-3 font-sans">
      <div className="relative w-full overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#121212] to-transparent z-10 pointer-events-none" />
        
        <div 
          ref={containerRef}
          className="flex items-center gap-2 px-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {allThemes.map((theme) => {
            const isActive = currentTheme === theme
            return (
              <button
                key={theme}
                data-active={isActive}
                onClick={() => handleThemeChange(theme)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 active:scale-95 snap-start whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105 z-20 relative'
                    : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50'
                }`}
              >
                {theme === 'all' ? '전체' : theme}
              </button>
            )
          })}
          <div className="flex-shrink-0 w-8 h-1" />
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#121212] to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  )
}
