'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PremiumSubHeaderProps {
    title: React.ReactNode;
    backHref?: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    titleClassName?: string;
}

export default function PremiumSubHeader({ title, backHref, onBack, rightElement, titleClassName }: PremiumSubHeaderProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Intelligent Hide/Show Logic
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    return (
        <header
            className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[110] transition-all duration-500 ease-in-out bg-[#121212]/90 backdrop-blur-2xl border-b border-white/10 py-3 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div className="px-gutter flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-blue-400"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                        </button>
                    ) : backHref ? (
                        <Link
                            href={backHref}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-blue-400"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                        </Link>
                    ) : null}

                    <h1 className={`text-[15px] font-black text-white tracking-tighter transition-all duration-500 opacity-100 translate-x-0 ${titleClassName || 'truncate'}`}>
                        {/* className={`text-[15px] font-black text-white tracking-tighter truncate transition-all duration-500 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4' */}
                        {title}
                    </h1>
                </div>

                {/* Right Action */}
                <div className="flex-shrink-0 ml-2">
                    {rightElement}
                </div>
            </div>
        </header>
    )
}
