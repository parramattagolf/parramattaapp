'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RoundDetailHeader({ title }: { title: string }) {
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Show/Hide logic based on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }

            // Background/Title visibility logic
            if (currentScrollY > 60) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    return (
        <header
            className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
                } ${isScrolled ? 'bg-[#121212]/90 backdrop-blur-2xl border-b border-white/10 py-3' : 'bg-transparent py-6'
                }`}
        >
            <div className="px-6 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <Link
                        href="/rounds"
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${isScrolled
                                ? 'bg-white/5 border border-white/10'
                                : 'bg-black/20 backdrop-blur-md border border-white/5'
                            } text-white`}
                        aria-label="Back to rounds"
                    >
                        <ArrowLeft size={18} strokeWidth={3} />
                    </Link>

                    <h1 className={`text-[15px] font-black text-white tracking-tighter truncate transition-all duration-500 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                        }`}>
                        {title}
                    </h1>
                </div>

                {/* Optional Right Action Slot */}
                <div className="w-10"></div>
            </div>
        </header>
    )
}
