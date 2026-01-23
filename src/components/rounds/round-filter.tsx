'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function RoundFilter({ themes = [], activeTheme = 'all' }: { themes?: string[], activeTheme?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // States for mouse drag-to-scroll
  const [isDown, setIsDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isMoved, setIsMoved] = useState(false) // To prevent click when dragging
  
  const currentTheme = searchParams.get('theme') || activeTheme

  const handleThemeChange = (theme: string) => {
    // Only trigger if not dragging
    if (isMoved) return
    
    const params = new URLSearchParams(searchParams.toString())
    if (theme === 'all') {
      params.delete('theme')
    } else {
      params.set('theme', theme)
    }
    router.push(`/rounds?${params.toString()}`)
  }

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDown(true)
    setIsMoved(false)
    if (containerRef.current) {
      setStartX(e.pageX - containerRef.current.offsetLeft)
      setScrollLeft(containerRef.current.scrollLeft)
    }
  }

  const handleMouseLeave = () => {
    setIsDown(false)
  }

  const handleMouseUp = () => {
    setIsDown(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return
    e.preventDefault()
    if (containerRef.current) {
      const x = e.pageX - containerRef.current.offsetLeft
      const walk = (x - startX) * 2 // Scroll speed multiplier
      if (Math.abs(walk) > 5) setIsMoved(true)
      containerRef.current.scrollLeft = scrollLeft - walk
    }
  }

  useEffect(() => {
    if (containerRef.current && !isDown) {
      const activeBtn = containerRef.current.querySelector('[data-active="true"]')
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentTheme, isDown])

  const allThemes = ['all', ...themes]

  return (
    <div className="fixed top-[51px] left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[90] bg-[#121212]/90 backdrop-blur-2xl border-b border-white/10 py-3 font-sans">
      <div className="relative w-full overflow-hidden">
        {/* Left Gradient Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#121212] to-transparent z-10 pointer-events-none" />
        
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex items-center gap-2 px-8 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth touch-pan-x h-[44px] select-none ${
            isDown ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ overscrollBehaviorX: 'contain' }}
        >
          {allThemes.map((theme) => {
            const isActive = currentTheme === theme
            return (
              <button
                key={theme}
                data-active={isActive}
                onClick={() => handleThemeChange(theme)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 active:scale-95 snap-start whitespace-nowrap pointer-events-auto ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20 relative ring-1 ring-blue-400/50'
                    : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50'
                }`}
              >
                {theme === 'all' ? '전체' : theme}
              </button>
            )
          })}
          {/* Spacing for end of scroll */}
          <div className="flex-shrink-0 w-8 h-1" />
        </div>

        {/* Right Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#121212] to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  )
}
