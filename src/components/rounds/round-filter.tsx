'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function RoundFilter({ themes = [], activeTheme = 'all' }: { themes?: string[], activeTheme?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  
  const currentTheme = searchParams.get('theme') || activeTheme

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Scrolled down -> Hide
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false)
      } 
      // Scrolled up -> Show
      else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleThemeChange = (theme: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (theme === 'all') {
      params.delete('theme')
    } else {
      params.set('theme', theme)
    }
    router.push(`/rounds?${params.toString()}`)
  }

  // Sort themes: 'all' first, then by text length (short to long) to optimize space
  const allThemes = ['all', ...themes.sort((a, b) => {
    // Primary sort: Length (Shortest first)
    if (a.length !== b.length) return a.length - b.length;
    // Secondary sort: Alphabetical
    return a.localeCompare(b);
  })]

  return (
    <div className={`fixed top-[50px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[80] bg-[#121212] py-4 font-sans transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-[120%]'}`}>
      <div className="relative w-full px-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {allThemes.map((theme) => {
            const isActive = currentTheme === theme
            return (
              <button
                key={theme}
                data-active={isActive}
                onClick={() => handleThemeChange(theme)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold tracking-tight transition-all duration-200 active:scale-95 border ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 border-emerald-500'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border-white/5'
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
